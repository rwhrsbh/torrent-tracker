// Функция для очистки названий игр от лишних меток
function cleanGameTitle(title: string): string {
  let cleaned = title;
  
  // Убираем версии и билды в скобках: (v1.0.1), (#12345), (Build 123)
  cleaned = cleaned.replace(/\s*\([v#]?[\d\.\-#]+[^\)]*\)/gi, '');
  
  // Убираем языковые метки: (MULTi17), (RUS/ENG), (Multi-language)
  cleaned = cleaned.replace(/\s*\((MULTi?\d*|RUS|ENG|Multi[\-\s]?language?|Language\s*Pack)[^\)]*\)/gi, '');
  
  // Убираем DLC и контент метки: (All DLCs), (+ DLC), (Complete Edition)
  cleaned = cleaned.replace(/\s*\([^\)]*DLC[^\)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\([^\)]*Enhanced Graphics Pack[^\)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\([^\)]*Bonus Content[^\)]*\)/gi, '');
  
  // Убираем размер файлов: (From 10.4 GB), (7.9 GB)
  cleaned = cleaned.replace(/\s*\([Ff]rom\s+[\d\.]+ [KMGT]B\)/gi, '');
  cleaned = cleaned.replace(/\s*\([\d\.]+ [KMGT]B\)/gi, '');
  
  // Убираем метки репаков: [DODI Repack], [FitGirl Repack], [Repack]
  cleaned = cleaned.replace(/\s*\[[^\]]*[Rr]epack[^\]]*\]/gi, '');
  
  // Убираем лишние пробелы и дефисы в конце
  cleaned = cleaned.replace(/\s*[-\s]+$/, '').trim();
  
  return cleaned;
}

// Rate limiting для Gemini API (10 запросов в минуту)
class GeminiRateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 минута в миллисекундах

  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Удаляем запросы старше 1 минуты
    this.requestTimes = this.requestTimes.filter(time => now - time < this.timeWindow);
    
    // Если достигли лимита, ждем
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // +1 секунда для безопасности
      return this.waitForRateLimit(); // Рекурсивно проверяем снова
    }
    
    // Добавляем текущий запрос
    this.requestTimes.push(now);
  }
}

const geminiRateLimiter = new GeminiRateLimiter();

// Функция для получения жанров через Gemini API с разбивкой на чанки
export async function detectGenresWithAI(titles: string[]): Promise<{ [title: string]: { genres: string[], cleanTitle?: string, version?: string } }> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found, using default genres');
    const result: { [title: string]: { genres: string[], cleanTitle?: string, version?: string } } = {};
    titles.forEach(title => {
      result[title] = { genres: ['Game'] };
    });
    return result;
  }

  const CHUNK_SIZE = 200; // Уменьшили размер чанка для снижения нагрузки
  const allResults: { [title: string]: { genres: string[], cleanTitle?: string, version?: string } } = {};

  // Разбиваем на чанки по 200 игр
  for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
    const chunk = titles.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(titles.length / CHUNK_SIZE)} (${chunk.length} games)`);
    
    try {
      // Ждем разрешения на запрос согласно rate limit
      await geminiRateLimiter.waitForRateLimit();
      
      const chunkResult = await processGenresChunk(chunk);
      Object.assign(allResults, chunkResult);
    } catch (error) {
      console.error(`Error processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}:`, error);
      // Fallback для этого чанка
      chunk.forEach(title => {
        allResults[title] = { genres: ['Game'] };
      });
    }

    // Увеличенная пауза между запросами для соблюдения rate limit
    if (i + CHUNK_SIZE < titles.length) {
      console.log('Waiting 3 seconds before next chunk...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return allResults;
}

// Функция для обработки одного чанка с retry механизмом
async function processGenresChunk(titles: string[], retryCount = 0): Promise<{ [title: string]: { genres: string[], cleanTitle?: string, version?: string } }> {
  const maxRetries = 2; // Максимум 3 попытки (0, 1, 2)
  const prompt = `Проанализируй следующие названия игр. Очисти их от лишних меток (языки, репаки, размеры файлов, DLC информация) но СОХРАНИ информацию о версии/билде. Определи жанры. Для каждой игры верни 1-3 наиболее подходящих жанра из списка: Action, Adventure, RPG, Strategy, Simulation, Racing, Sports, Puzzle, Horror, Platformer, Survival, Indie, Multiplayer, Sandbox, Open World, Shooter, Fighting, MMORPG, Card Game, Educational, Stealth, Tower Defense, Battle Royale, Real-time Strategy, Turn-based Strategy.

ОЧЕНЬ ВАЖНО: Формат ответа должен быть строго валидным JSON без дополнительного текста, комментариев или символов. Для каждой игры укажи:
{
  "очищенное название игры 1": {
    "genres": ["жанр1", "жанр2"],
    "version": "1.0.2"
  },
  "очищенное название игры 2": {
    "genres": ["жанр1"],
    "version": "Build 10092024"
  },
  "очищенное название игры 3": {
    "genres": ["жанр1", "жанр2"],
    "version": null
  }
}

Примеры очистки:
- "Captain Blood (MULTi17) [DODI Repack]" -> "Captain Blood" (version: null)
- "Satisfactory Build 10092024" -> "Satisfactory" (version: "Build 10092024")
- "Ale & Tale Tavern 1.0.2" -> "Ale & Tale Tavern" (version: "1.0.2")
- "Age of Empires II: Definitive Edition (v101.103.12349.0 + All DLCs + MULTi17)" -> "Age of Empires II: Definitive Edition" (version: "v101.103.12349.0")

Названия игр для обработки:
${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}`;

  // Создаем маппинг оригинальных названий (удалена неиспользуемая переменная)

  try {
    const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 0
      },
      responseMimeType: "application/json",
      maxOutputTokens: 1000000
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      console.log('Rate limit exceeded (429), waiting 70 seconds...');
      await new Promise(resolve => setTimeout(resolve, 70000)); // Ждем 70 секунд
      return processGenresChunk(titles, retryCount); // Повторяем запрос с тем же счетчиком retry
    }
    throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Gemini API response structure:', JSON.stringify(data, null, 2));
  
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiResponse) {
    console.error('No AI response found in data:', data);
    throw new Error('No response from Gemini API');
  }
  
  console.log('Raw AI response length:', aiResponse.length);

  // Более тщательная очистка JSON ответа
  let cleanedResponse = aiResponse.trim();
  
  // Убираем markdown блоки
  cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Убираем лишние символы в начале и конце
  cleanedResponse = cleanedResponse.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
  
  // Находим первую { и последнюю }
  const firstBrace = cleanedResponse.indexOf('{');
  const lastBrace = cleanedResponse.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('Invalid JSON structure in response');
  }
  
  cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);

  console.log('Cleaned response preview:', cleanedResponse.substring(0, 500) + '...');

  let genresResult;
  try {
    genresResult = JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response that failed to parse:', cleanedResponse.substring(0, 1000));
    throw parseError;
  }

  // Валидация результата и fallback для игр без жанров
  const result: { [title: string]: { genres: string[], cleanTitle?: string, version?: string } } = {};
  
  // Поскольку AI возвращает очищенные названия как ключи, нам нужно найти соответствие
  titles.forEach(originalTitle => {
    let found = false;
    
    // Пытаемся найти жанры по любому из возможных очищенных названий
    for (const [cleanedTitle, gameData] of Object.entries(genresResult)) {
      // Проверяем новый формат с версиями
      if (gameData && typeof gameData === 'object' && 'genres' in gameData && Array.isArray(gameData.genres)) {
        const ourCleaned = cleanGameTitle(originalTitle);
        if (cleanedTitle.toLowerCase().includes(ourCleaned.toLowerCase()) || 
            ourCleaned.toLowerCase().includes(cleanedTitle.toLowerCase()) ||
            cleanedTitle === ourCleaned) {
          result[originalTitle] = {
            genres: gameData.genres,
            cleanTitle: cleanedTitle,
            version: (gameData as any).version || null
          };
          found = true;
          break;
        }
      }
      // Fallback для старого формата (массив жанров)
      else if (Array.isArray(gameData) && gameData.length > 0) {
        const ourCleaned = cleanGameTitle(originalTitle);
        if (cleanedTitle.toLowerCase().includes(ourCleaned.toLowerCase()) || 
            ourCleaned.toLowerCase().includes(cleanedTitle.toLowerCase()) ||
            cleanedTitle === ourCleaned) {
          result[originalTitle] = { genres: gameData };
          found = true;
          break;
        }
      }
    }
    
    // Fallback если не найдено соответствие
    if (!found) {
      result[originalTitle] = { genres: ['Game'] };
    }
  });

  return result;
  
  } catch (error) {
    console.error(`Error in processGenresChunk (attempt ${retryCount + 1}):`, error);
    
    // Если это не последняя попытка, пробуем еще раз
    if (retryCount < maxRetries) {
      console.log(`Retrying chunk processing (attempt ${retryCount + 2}/${maxRetries + 1})...`);
      
      // Если это ошибка 429 или "No response", ждем дольше
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('No response');
      const waitTime = isRateLimitError ? 15000 : 5000; // 15 секунд для rate limit, 5 для других ошибок
      
      console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return processGenresChunk(titles, retryCount + 1);
    }
    
    // Если все попытки неудачны, возвращаем fallback результат
    console.log(`All retry attempts failed for chunk, using fallback genres`);
    const fallbackResult: { [title: string]: { genres: string[], cleanTitle?: string, version?: string } } = {};
    titles.forEach(title => {
      fallbackResult[title] = { genres: ['Game'] };
    });
    return fallbackResult;
  }
}

// Обычная функция для одной игры (fallback)
export function detectGenres(_title: string): string[] {
  return ['Game'];
}
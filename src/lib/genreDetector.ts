const genreKeywords = {
  'Action': ['action', 'combat', 'fighting', 'battle', 'war', 'shooter', 'fps', 'assault', 'sniper'],
  'Adventure': ['adventure', 'quest', 'journey', 'exploration', 'mystery'],
  'RPG': ['rpg', 'role playing', 'fantasy', 'magic', 'wizard', 'knight', 'dragon', 'dungeon'],
  'Strategy': ['strategy', 'tactical', 'empire', 'civilization', 'build', 'management', 'city'],
  'Simulation': ['simulator', 'simulation', 'sim', 'farming', 'truck', 'flight', 'driving'],
  'Racing': ['racing', 'race', 'speed', 'formula', 'rally', 'drift', 'cars'],
  'Sports': ['football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'hockey', 'fifa', 'nba'],
  'Puzzle': ['puzzle', 'brain', 'logic', 'match', 'tetris', 'sudoku'],
  'Horror': ['horror', 'scary', 'zombie', 'dead', 'fear', 'nightmare', 'evil'],
  'Platformer': ['platformer', 'jump', 'mario', 'sonic', 'runner'],
  'Survival': ['survival', 'craft', 'minecraft', 'rust', 'forest', 'island'],
  'Indie': ['indie', 'independent'],
  'Multiplayer': ['multiplayer', 'online', 'mmo', 'co-op', 'versus'],
  'Sandbox': ['sandbox', 'creative', 'build', 'create'],
  'Open World': ['open world', 'gta', 'skyrim', 'fallout', 'witcher']
};

export function detectGenres(title: string): string[] {
  const titleLower = title.toLowerCase();
  const detectedGenres: string[] = [];

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        if (!detectedGenres.includes(genre)) {
          detectedGenres.push(genre);
        }
        break;
      }
    }
  }

  // If no genres detected, try to classify based on common patterns
  if (detectedGenres.length === 0) {
    if (titleLower.includes('repack') || titleLower.includes('fitgirl')) {
      // These are typically games, assign a default genre
      detectedGenres.push('Game');
    }
  }

  return detectedGenres.length > 0 ? detectedGenres : ['Game'];
}
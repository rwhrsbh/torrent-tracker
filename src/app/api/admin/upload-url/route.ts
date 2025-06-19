import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import { detectGenres, detectGenresWithAI } from '@/lib/genreDetector';

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch JSON from URL
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch JSON from URL' }, { status: response.status });
    }

    const jsonData = await response.json();
    
    if (!jsonData.name || !jsonData.downloads || !Array.isArray(jsonData.downloads)) {
      return NextResponse.json({ error: 'Invalid JSON format from URL' }, { status: 400 });
    }

    await connectDB();

    // Собираем все названия игр для которых нужно определить жанры
    const newGameTitles: string[] = [];
    const gameDataMap: { [title: string]: any } = {};

    for (const download of jsonData.downloads) {
      console.log('Processing download:', download.title, 'uploadDate:', download.uploadDate);
      
      const existingGame = await GameTorrent.findOne({ title: download.title });
      
      // Parse date safely
      let uploadDate = new Date();
      if (download.uploadDate) {
        const parsedDate = new Date(download.uploadDate);
        console.log('Parsed date:', parsedDate, 'isValid:', !isNaN(parsedDate.getTime()));
        if (!isNaN(parsedDate.getTime())) {
          uploadDate = parsedDate;
        }
      }

      const sourceData = {
        name: jsonData.name,
        uris: download.uris,
        uploadDate: uploadDate,
        fileSize: download.fileSize || 'Unknown',
      };

      if (existingGame) {
        const existingSourceIndex = existingGame.sources.findIndex(s => s.name === jsonData.name);
        if (existingSourceIndex >= 0) {
          existingGame.sources[existingSourceIndex] = sourceData;
        } else {
          existingGame.sources.push(sourceData);
        }
        await existingGame.save();
      } else {
        // Если жанры не указаны в JSON, добавляем в список для AI определения
        if (!download.genres || !Array.isArray(download.genres) || download.genres.length === 0) {
          newGameTitles.push(download.title);
        }
        gameDataMap[download.title] = { download, sourceData };
      }
    }

    // Получаем жанры через AI для новых игр
    let aiGenres: { [title: string]: { genres: string[], cleanTitle?: string, version?: string } } = {};
    if (newGameTitles.length > 0) {
      console.log(`Getting AI genres for ${newGameTitles.length} games:`, newGameTitles);
      aiGenres = await detectGenresWithAI(newGameTitles);
    }

    // Создаем новые игры
    let processedGames = 0;
    for (const [title, data] of Object.entries(gameDataMap)) {
      const { download, sourceData } = data;
      
      // Используем жанры из JSON если есть, иначе из AI, иначе дефолтные
      let genres: string[];
      let cleanTitle: string | undefined;
      let version: string | undefined;
      
      if (download.genres && Array.isArray(download.genres) && download.genres.length > 0) {
        genres = download.genres;
      } else if (aiGenres[title]) {
        genres = aiGenres[title].genres;
        cleanTitle = aiGenres[title].cleanTitle;
        version = aiGenres[title].version;
      } else {
        genres = detectGenres(download.title);
      }
      
      const newGame = new GameTorrent({
        title: download.title,
        cleanTitle: cleanTitle,
        version: version,
        genres: genres,
        sources: [sourceData],
      });
      await newGame.save();
      processedGames++;
    }

    return NextResponse.json({ 
      message: `Successfully processed ${processedGames} games from ${jsonData.name} (URL: ${url})` 
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 });
  }
}
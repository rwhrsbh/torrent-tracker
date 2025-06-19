import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import { detectGenres, detectGenresWithAI } from '@/lib/genreDetector';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const adminToken = formData.get('adminToken') as string;
    
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const jsonData = JSON.parse(text);
    
    if (!jsonData.name || !jsonData.downloads || !Array.isArray(jsonData.downloads)) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    await connectDB();

    // Собираем все названия игр для которых нужно определить жанры
    const newGameTitles: string[] = [];
    const gameDataMap: { [title: string]: any } = {};

    for (const download of jsonData.downloads) {
      const existingGame = await GameTorrent.findOne({ title: download.title });
      
      // Parse date safely
      let uploadDate = new Date();
      if (download.uploadDate) {
        const parsedDate = new Date(download.uploadDate);
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
      message: `Successfully processed ${processedGames} games from ${jsonData.name}` 
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
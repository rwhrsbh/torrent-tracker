import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import { detectGenres } from '@/lib/genreDetector';

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.name || !body.downloads || !Array.isArray(body.downloads)) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    await connectDB();

    let processedGames = 0;

    for (const download of body.downloads) {
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
        name: body.name,
        uris: download.uris,
        uploadDate: uploadDate,
        fileSize: download.fileSize || 'Unknown',
      };

      if (existingGame) {
        const existingSourceIndex = existingGame.sources.findIndex(s => s.name === body.name);
        if (existingSourceIndex >= 0) {
          existingGame.sources[existingSourceIndex] = sourceData;
        } else {
          existingGame.sources.push(sourceData);
        }
        await existingGame.save();
      } else {
        // Используем жанры из JSON если есть, иначе дефолтные
        const genres = download.genres && Array.isArray(download.genres) && download.genres.length > 0 
          ? download.genres 
          : detectGenres(download.title);
          
        const newGame = new GameTorrent({
          title: download.title,
          genres: genres,
          sources: [sourceData],
        });
        await newGame.save();
      }
      processedGames++;
    }

    return NextResponse.json({ 
      message: `Successfully processed ${processedGames} games from ${body.name}` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
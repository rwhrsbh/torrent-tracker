import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const sources = searchParams.get('sources')?.split(',').filter(Boolean);
    const genres = searchParams.get('genres')?.split(',').filter(Boolean);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (sources && sources.length > 0) {
      query['sources.name'] = { $in: sources };
    }
    
    if (genres && genres.length > 0) {
      query.genres = { $in: genres };
    }
    
    const [games, total] = await Promise.all([
      GameTorrent.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      GameTorrent.countDocuments(query)
    ]);
    
    let filteredGames = games;
    if (sources && sources.length > 0) {
      filteredGames = games.map(game => ({
        ...game.toObject(),
        sources: game.sources.filter(source => sources.includes(source.name))
      }));
    }
    
    return NextResponse.json({
      games: filteredGames,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
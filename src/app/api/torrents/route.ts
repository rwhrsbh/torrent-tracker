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
    
    // Build aggregation pipeline for grouping by cleanTitle
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: { $ifNull: ['$cleanTitle', '$title'] },
          games: { $push: '$$ROOT' },
          totalLikes: { $sum: '$likes' },
          allSources: { $push: '$sources' },
          genres: { $first: '$genres' },
          cleanTitle: { $first: '$cleanTitle' },
          title: { $first: '$title' },
          version: { $first: '$version' },
          createdAt: { $min: '$createdAt' },
          updatedAt: { $max: '$updatedAt' },
          likedBy: { $push: '$likedBy' }
        }
      },
      {
        $project: {
          _id: 1,
          cleanTitle: 1,
          title: 1,
          version: 1,
          genres: 1,
          likes: '$totalLikes',
          createdAt: 1,
          updatedAt: 1,
          likedBy: {
            $reduce: {
              input: '$likedBy',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          },
          sources: {
            $reduce: {
              input: '$allSources',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      { $sort: { updatedAt: -1 } }
    ];

    const [games, totalResult] = await Promise.all([
      GameTorrent.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit }
      ]),
      GameTorrent.aggregate([
        ...pipeline,
        { $count: 'total' }
      ])
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    let filteredGames = games;
    if (sources && sources.length > 0) {
      filteredGames = games.map(game => ({
        ...game,
        sources: game.sources.filter((source: any) => sources.includes(source.name))
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
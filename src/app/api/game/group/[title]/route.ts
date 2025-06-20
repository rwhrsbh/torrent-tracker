import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    await connectDB();
    
    const { title } = await params;
    const decodedTitle = decodeURIComponent(title);
    
    const games = await GameTorrent.aggregate([
      {
        $match: {
          $or: [
            { cleanTitle: decodedTitle },
            { title: decodedTitle }
          ]
        }
      },
      {
        $group: {
          _id: {
            $ifNull: ['$cleanTitle', '$title']
          },
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
          totalLikes: 1,
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
          },
          games: 1
        }
      }
    ]);
    
    if (!games || games.length === 0) {
      return NextResponse.json({ error: 'Game group not found' }, { status: 404 });
    }
    
    const groupedGame = games[0];
    
    // Add version information to each source based on original game data
    const sourcesWithVersions = groupedGame.sources.map((source: any) => {
      const originalGame = groupedGame.games.find((game: any) => 
        game.sources.some((s: any) => s.name === source.name && s.uploadDate === source.uploadDate)
      );
      return {
        ...source,
        gameVersion: originalGame?.version || null,
        originalTitle: originalGame?.title || null
      };
    });
    
    return NextResponse.json({
      ...groupedGame,
      sources: sourcesWithVersions
    });
  } catch (error) {
    console.error('Fetch grouped game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
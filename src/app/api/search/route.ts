import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import Fuse from 'fuse.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }
    
    // Get all games and group by cleanTitle
    const allGames = await GameTorrent.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ['$cleanTitle', '$title']
          },
          games: { $push: '$$ROOT' },
          genres: { $first: '$genres' },
          title: { $first: '$title' },
          cleanTitle: { $first: '$cleanTitle' },
          version: { $first: '$version' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          cleanTitle: 1,
          version: 1,
          genres: 1,
          gameCount: { $size: '$games' },
          createdAt: 1
        }
      }
    ]);
    
    // Configure Fuse.js options for optimal game search
    const fuseOptions = {
      keys: [
        {
          name: 'cleanTitle',
          weight: 0.6
        },
        {
          name: 'title',
          weight: 0.4
        }
      ],
      threshold: 0.3, // Lower threshold = more strict matching
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true,
      ignoreLocation: true,
      useExtendedSearch: false
    };
    
    // Create Fuse instance
    const fuse = new Fuse(allGames, fuseOptions);
    
    // Perform fuzzy search
    const searchResults = fuse.search(query);
    
    // Format results and limit to 10
    const suggestions = searchResults
      .slice(0, 10)
      .map(result => ({
        ...result.item,
        fuseScore: result.score
      }));
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
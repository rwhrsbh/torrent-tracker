import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }
    
    const suggestions = await GameTorrent.find({
      $text: { $search: query }
    }, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .select('title genres');
    
    // Fallback to regex search if text search doesn't find results
    if (suggestions.length === 0) {
      const fallbackSuggestions = await GameTorrent.find({
        title: { $regex: query, $options: 'i' }
      })
      .limit(10)
      .select('title genres');
      
      return NextResponse.json(fallbackSuggestions);
    }
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
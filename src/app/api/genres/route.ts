import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET() {
  try {
    await connectDB();
    
    const genres = await GameTorrent.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    return NextResponse.json(genres.map(g => ({ name: g._id, count: g.count })));
  } catch (error) {
    console.error('Fetch genres error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
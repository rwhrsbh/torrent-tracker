import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET() {
  try {
    await connectDB();
    
    const sources = await GameTorrent.aggregate([
      { $unwind: '$sources' },
      { $group: { _id: '$sources.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    return NextResponse.json(sources.map(s => ({ name: s._id, count: s.count })));
  } catch (error) {
    console.error('Fetch sources error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
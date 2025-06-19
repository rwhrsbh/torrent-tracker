import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const game = await GameTorrent.findById(params.id);
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('Fetch game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
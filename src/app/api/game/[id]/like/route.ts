import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    const userId = decoded.userId;

    const game = await GameTorrent.findById(params.id);
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const isLiked = game.likedBy.includes(userId);
    
    if (isLiked) {
      // Unlike
      game.likedBy = game.likedBy.filter(id => id.toString() !== userId);
      game.likes = Math.max(0, game.likes - 1);
    } else {
      // Like
      game.likedBy.push(userId);
      game.likes += 1;
    }

    await game.save();
    
    return NextResponse.json({ 
      likes: game.likes, 
      likedBy: game.likedBy,
      isLiked: !isLiked 
    });
  } catch (error) {
    console.error('Like game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
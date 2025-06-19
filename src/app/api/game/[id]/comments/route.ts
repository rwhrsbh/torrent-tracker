import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import Comment from '@/models/Comment';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const comments = await Comment.find({ game: params.id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 });
    }

    const game = await GameTorrent.findById(params.id);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const comment = new Comment({
      user: userId,
      game: params.id,
      content: content.trim(),
    });

    await comment.save();

    // Add comment to game
    game.comments.push(comment._id);
    await game.save();

    // Add comment to user
    await User.findByIdAndUpdate(userId, {
      $push: { comments: comment._id }
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username');

    return NextResponse.json(populatedComment);
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
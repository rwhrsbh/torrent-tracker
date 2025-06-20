import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameTorrent from '@/models/Torrent';
import Comment from '@/models/Comment';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    await connectDB();
    
    const { title } = await params;
    const decodedTitle = decodeURIComponent(title);
    
    console.log('Fetching comments for game group:', decodedTitle);
    
    // Get all comments for this game group
    const comments = await Comment.find({ 
      gameGroup: decodedTitle 
    })
    .populate('user', 'username')
    .sort({ createdAt: -1 });
    
    console.log('Found comments:', comments.length);
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    await connectDB();
    
    const { title } = await params;
    const decodedTitle = decodeURIComponent(title);
    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    // Get user from token
    const token = request.cookies.get('token')?.value;
    console.log('Token found:', !!token);
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
      console.log('Token decoded, user ID:', userId);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify the game group exists
    console.log('Checking if game group exists for title:', decodedTitle);
    const gameExists = await GameTorrent.findOne({
      $or: [
        { cleanTitle: decodedTitle },
        { title: decodedTitle }
      ]
    });
    
    console.log('Game exists:', !!gameExists);
    if (gameExists) {
      console.log('Found game:', { title: gameExists.title, cleanTitle: gameExists.cleanTitle });
    }
    
    if (!gameExists) {
      return NextResponse.json({ error: 'Game group not found' }, { status: 404 });
    }
    
    console.log('Creating comment for game group:', decodedTitle);
    console.log('User ID:', userId);
    console.log('Content:', content.trim());
    
    // Create comment
    const comment = new Comment({
      user: userId,
      content: content.trim(),
      gameGroup: decodedTitle
    });
    
    console.log('Comment object before save:', comment);
    
    const savedComment = await comment.save();
    console.log('Comment saved successfully:', savedComment._id);
    
    // Get user info separately to avoid populate issues
    const user = await User.findById(userId, 'username');
    console.log('User found:', user);
    
    const responseComment = {
      ...savedComment.toObject(),
      user: user
    };
    
    return NextResponse.json(responseComment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email or username already exists' 
      }, { status: 400 });
    }

    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      joinDate: user.joinDate,
      isAdmin: user.isAdmin,
    };

    return NextResponse.json({ 
      message: 'User registered successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
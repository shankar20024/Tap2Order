import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectDB();

    // Define User model if not already defined
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String
    }));

    // Find user by ID
    const user = await User.findById(userId).select('name email role');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user data', 
      details: error.message 
    }, { status: 500 });
  }
}

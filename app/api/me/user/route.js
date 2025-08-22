import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

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

    // Find user by ID and get business name
    const user = await User.findById(userId).select('name email role businessName');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.businessName || user.name, // Use businessName, fallback to personal name
      username: user.name,
      hotelName: user.businessName || user.name,
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

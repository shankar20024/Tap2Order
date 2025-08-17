import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user by ID
    const user = await User.findById(id).select('name email businessName hotelCode role').lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      hotelName: user.businessName,
      hotelCode: user.hotelCode,
      role: user.role
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

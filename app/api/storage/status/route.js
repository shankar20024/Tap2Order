import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { User } from '@/models/User';
import { connectDB } from '@/lib/mongodb';

// Simple auth options for session check
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Storage API - Session:', session);

    if (!session?.user?.email) {
      console.log('Storage API - No session user email');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Storage API - User email:', session.user.email);

    await connectDB();
    console.log('Storage API - DB connected');

    const user = await User.findOne({ email: session.user.email });
    console.log('Storage API - User found:', !!user);

    if (!user) {
      console.log('Storage API - User not found by email');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Storage API - User ID:', user._id);
    console.log('Storage API - User createdAt:', user.createdAt);

    // Calculate storage usage based on user creation date
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Storage limit: 30 days
    const totalStorage = 30;
    const usedDays = Math.min(daysSinceCreation, totalStorage);

    // Determine storage level
    let storageLevel = 'normal';
    if (usedDays >= totalStorage * 0.8) {
      storageLevel = 'critical';
    } else if (usedDays >= totalStorage * 0.6) {
      storageLevel = 'warning';
    }

    const storageInfo = {
      totalStorage,
      usedDays,
      storageLevel,
      daysRemaining: Math.max(0, totalStorage - usedDays),
      createdAt: user.createdAt,
      percentageUsed: Math.round((usedDays / totalStorage) * 100)
    };

    return NextResponse.json(storageInfo);

  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage data' },
      { status: 500 }
    );
  }
}

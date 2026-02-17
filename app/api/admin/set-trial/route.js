import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, trialDays = 30 } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Set trial dates
    const now = new Date();
    const trialExpiry = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
    const dataResetDate = new Date(trialExpiry.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 days after expiry

    // Update user
    await User.findByIdAndUpdate(
      user._id,
      {
        subscriptionStatus: 'trial',
        subscriptionExpiry: trialExpiry,
        subscriptionStartDate: now,
        dataResetDate: dataResetDate,
        isDataReset: false,
        lastDataReset: null,
        isActive: true
      }
    );

    return NextResponse.json({
      success: true,
      message: `Trial period set for ${trialDays} days`,
      details: {
        email: user.email,
        trialDays: trialDays,
        trialExpiry: trialExpiry,
        dataResetDate: dataResetDate
      }
    });

  } catch (error) {
    console.error('Set trial error:', error);
    return NextResponse.json(
      { error: 'Failed to set trial period' },
      { status: 500 }
    );
  }
}

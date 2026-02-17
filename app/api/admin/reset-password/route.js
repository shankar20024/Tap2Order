import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Authenticate admin
    const authResult = await getAuthUser(request);
    
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    console.log('=== FIXING PASSWORD FOR ===', email);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('Current password (plain):', user.password);
    console.log('Password length:', user.password.length);
    
    // Hash the plain password properly
    const hashedPassword = await bcrypt.hash(user.password, 12);
    console.log('New hashed password length:', hashedPassword.length);
    
    // Update user with proper hashed password
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword }
    );
    
    console.log('✅ Password fixed for user:', email);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password has been properly hashed',
      details: {
        oldPasswordLength: user.password.length,
        newPasswordLength: hashedPassword.length
      }
    });
    
  } catch (error) {
    console.error('Fix password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();
    
    console.log('=== DEBUG LOGIN TEST ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', user.email);
    console.log('Has password:', !!user.password);
    console.log('Password type:', typeof user.password);
    console.log('Password length:', user.password ? user.password.length : 0);
    
    // Test password comparison
    if (!user.password) {
      console.log('ERROR: User has no password!');
      return NextResponse.json({ error: 'No password set' }, { status: 400 });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValid);
    
    if (isValid) {
      console.log('✅ Login successful!');
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          businessName: user.businessName
        }
      });
    } else {
      console.log('❌ Password comparison failed');
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Debug login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

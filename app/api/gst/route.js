import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authMiddleware } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    // Use auth middleware to get authenticated user
    const authResult = await authMiddleware(request);
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    
    await connectDB();
    
    // Fetch user's GST details
    const user = await User.findById(userId).select('gstDetails');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract GST information
    const gstDetails = user.gstDetails || {};
    const hasGstNumber = gstDetails.gstNumber && gstDetails.gstNumber.trim() !== '';
    const taxRate = gstDetails.taxRate || 0;

    const response = {
      hasGstNumber,
      taxRate,
      gstNumber: gstDetails.gstNumber || ''
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

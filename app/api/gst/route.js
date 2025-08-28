import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    // Use auth middleware to get authenticated user
    const authResult = await getAuthUser(request);
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    
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

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { User } from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(session.user.id).select(
      'businessName address phone hotelPhone email hotelCode businessType'
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format business info for thermal printer
    const businessInfo = {
      name: user.businessName || 'Tap2Order Restaurant',
      address: user.address ? 
        `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.zipCode || ''}`.trim().replace(/^,|,$/, '') :
        'Restaurant Address',
      phone: user.hotelPhone || user.phone || '+91 XXXXX XXXXX',
      email: user.email || 'info@restaurant.com',
      gst: `GST No: ${user.hotelCode || 'XXXXXXXXX'}`,
      hotelCode: user.hotelCode || 'N/A'
    };

    return NextResponse.json({ businessInfo });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

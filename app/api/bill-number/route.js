import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BillCounter from '@/models/BillCounter';
import { getAuthUser } from '@/lib/auth-middleware';

export async function POST(request) {
  try {
    await connectDB();
    
    // Authenticate request
    const authResult = await getAuthUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    
    // Get current date in YYYY-MM-DD format (Indian timezone)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    // Find or create bill counter for today
    let billCounter = await BillCounter.findOne({
      hotelOwner: userId,
      date: today
    });

    if (!billCounter) {
      // Create new counter for today starting at 1
      billCounter = new BillCounter({
        hotelOwner: userId,
        date: today,
        counter: 1
      });
    } else {
      // Increment existing counter
      billCounter.counter += 1;
    }

    await billCounter.save();

    return NextResponse.json({
      billNumber: billCounter.counter,
      date: today
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate bill number' },
      { status: 500 }
    );
  }
}

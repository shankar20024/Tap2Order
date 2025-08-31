import { NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  const { userId, tableNumber } =  await params;

  if (!userId || !tableNumber) {
    return NextResponse.json({ error: 'User ID and Table Number are required' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
  }

  await connectDB();

  try {
    // Find any order for this table that is not fully paid
    const unpaidOrder = await Order.findOne({
      userId: userId,
      tableNumber: tableNumber,
      paymentStatus: 'unpaid',
      status: { $nin: ['cancelled', 'completed'] } // Exclude orders that are finished
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (unpaidOrder) {
      // If an unpaid order exists, the table is occupied
      return NextResponse.json({
        isOccupied: true,
        customerInfo: unpaidOrder.customerInfo, // Send customer info for validation
      });
    } else {
      // No unpaid orders, the table is free
      return NextResponse.json({ isOccupied: false });
    }
  } catch (error) {
    console.error('Error checking table status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

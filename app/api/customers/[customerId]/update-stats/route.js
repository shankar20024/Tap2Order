import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const paramsValue = await params;
    const { customerId } = paramsValue;
    const { totalAmount } = await request.json();
    
    if (!customerId || !totalAmount) {
      return NextResponse.json(
        { error: 'Customer ID and total amount are required' },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer statistics
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    customer.lastVisit = new Date();
    
    await customer.save();

    return NextResponse.json({ 
      success: true,
      customer: {
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      }
    });

  } catch (error) {
    console.error('Update customer stats error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer statistics' },
      { status: 500 }
    );
  }
}

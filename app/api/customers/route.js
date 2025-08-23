import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, phone, userId, tableNumber, ip } = await request.json();
    console.log(' Customer API received data:', { name, phone, userId, tableNumber, ip });
    
    if (!name || !phone || !userId) {
      console.log(' Customer API validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Name, phone, and userId are required' },
        { status: 400 }
      );
    }

    // Check if customer already exists for this hotel
    let customer = await Customer.findOne({ userId, phone });
    console.log(' Existing customer found:', customer ? 'Yes' : 'No');
    
    if (customer) {
      // Update existing customer
      customer.name = name;
      customer.tableNumber = tableNumber;
      
      // Only increment visit count if it's a new day or different table
      const today = new Date();
      const lastVisitDate = customer.lastVisit ? new Date(customer.lastVisit) : null;
      const isSameDay = lastVisitDate && 
        lastVisitDate.getDate() === today.getDate() &&
        lastVisitDate.getMonth() === today.getMonth() &&
        lastVisitDate.getFullYear() === today.getFullYear();
      
      // Increment visit count only if:
      // 1. Different day, OR
      // 2. Same day but different table (customer moved tables)
      if (!isSameDay || customer.tableNumber !== tableNumber) {
        customer.visitCount += 1;
        console.log(' Visit count incremented - New visit detected');
      } else {
        console.log(' Same day, same table - Visit count not incremented (reorder)');
      }
      
      customer.lastVisit = new Date();
      if (ip) customer.ip = ip;
      
      await customer.save();
      console.log(' Existing customer updated:', customer._id);
    } else {
      // Create new customer
      customer = new Customer({
        name,
        phone,
        userId,
        tableNumber,
        ip: ip || null
      });
      
      await customer.save();
      console.log(' New customer created:', customer._id);
    }

    return NextResponse.json({ 
      success: true, 
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        visitCount: customer.visitCount
      }
    });

  } catch (error) {
    console.error(' Customer API error:', error);
    return NextResponse.json(
      { error: 'Failed to process customer data' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const customers = await Customer.find({ userId })
      .sort({ lastVisit: -1 })
      .limit(100);

    return NextResponse.json({ customers });

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

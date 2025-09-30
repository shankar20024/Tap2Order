import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bill } from "@/models/BillCounter";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    
    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Order ID and User ID are required" },
        { status: 400 }
      );
    }

    // Find bill that contains this order ID in its items or has orderId reference
    const bill = await Bill.findOne({
      userId: userId,
      $or: [
        { 'items._id': orderId },
        { orderId: orderId }
      ]
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found for this order" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error('Error fetching bill by order ID:', error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

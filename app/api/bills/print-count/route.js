import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bill } from "@/models/BillCounter";

export async function POST(request) {
  try {
    await connectDB();
    
    const { billNumber, userId } = await request.json();
    
    if (!billNumber || !userId) {
      return NextResponse.json(
        { error: "Bill number and User ID are required" },
        { status: 400 }
      );
    }

    // Find and update the bill's print count
    const bill = await Bill.findOneAndUpdate(
      { 
        billNumber: billNumber,
        userId: userId 
      },
      { 
        $inc: { printCount: 1 } 
      },
      { 
        new: true 
      }
    );

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Print count incremented successfully",
      printCount: bill.printCount 
    });
  } catch (error) {
    console.error('Error incrementing print count:', error);
    return NextResponse.json(
      { error: "Failed to increment print count" },
      { status: 500 }
    );
  }
}

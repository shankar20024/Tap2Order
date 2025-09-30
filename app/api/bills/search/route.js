import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import { Bill } from "@/models/BillCounter";

export async function GET(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const billNumber = searchParams.get('billNumber');
    
    if (!billNumber) {
      return NextResponse.json(
        { error: "Bill number is required" },
        { status: 400 }
      );
    }

    // Search for bill by bill number and user ID
    const bill = await Bill.findOne({
      billNumber: billNumber,
      userId: user.id
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error('Error searching bill:', error);
    return NextResponse.json(
      { error: "Failed to search bill" },
      { status: 500 }
    );
  }
}

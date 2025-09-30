import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import { Bill } from "@/models/BillCounter";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = params;

    // Find and delete bill
    const bill = await Bill.findOneAndDelete({
      _id: id,
      userId: user.id
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Bill deleted successfully" 
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}

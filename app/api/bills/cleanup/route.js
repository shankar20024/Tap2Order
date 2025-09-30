import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import { Bill } from "@/models/BillCounter";

export async function POST(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Find and remove duplicate bills (keep the latest one)
    const duplicateBills = await Bill.aggregate([
      { $match: { userId: user.id } },
      { 
        $group: {
          _id: "$billNumber",
          count: { $sum: 1 },
          docs: { $push: { id: "$_id", createdAt: "$createdAt" } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    let deletedCount = 0;

    for (const duplicate of duplicateBills) {
      // Sort by createdAt and keep the latest, delete the rest
      const sortedDocs = duplicate.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toDelete = sortedDocs.slice(1); // Keep first (latest), delete rest

      for (const doc of toDelete) {
        await Bill.findByIdAndDelete(doc.id);
        deletedCount++;
      }
    }

    return NextResponse.json({ 
      message: `Cleanup completed. Removed ${deletedCount} duplicate bills.`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up bills:', error);
    return NextResponse.json(
      { error: "Failed to cleanup bills" },
      { status: 500 }
    );
  }
}

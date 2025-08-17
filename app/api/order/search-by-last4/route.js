import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const last4 = (searchParams.get('last4') || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId must be a valid ObjectId' }, { status: 400 });
    }
    if (!last4 || !/^[0-9a-fA-F]{4}$/.test(last4)) {
      return NextResponse.json({ error: 'last4 must be 4 hex characters' }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Use aggregation to match ObjectId suffix and tenant
    const results = await Order.aggregate([
      { $match: { userId: userObjectId } },
      { $addFields: { idStr: { $toString: '$_id' } } },
      { $match: { idStr: { $regex: `${last4}$`, $options: 'i' } } },
      { $project: { idStr: 0 } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({ orders: results }, { status: 200 });
  } catch (err) {
    console.error('search-by-last4 GET error:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

import { connectDB } from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const items = await MenuItem.find({ userId, available: true });

  return NextResponse.json(items);
}


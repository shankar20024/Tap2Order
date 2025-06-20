import { connectDB } from "@/lib/mongodb";
import Table from "@/models/Table";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const tableNumber = parseInt(searchParams.get("tableNumber"));

  if (!userId || isNaN(tableNumber)) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const table = await Table.findOne({ userId, tableNumber });
  return NextResponse.json({ exists: !!table });
}

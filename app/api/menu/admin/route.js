import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import MenuItem from "@/models/MenuItem";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const body = await req.json();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const menuItem = await MenuItem.create({
    userId: session.user.id,
    ...body,
  });

  return NextResponse.json(menuItem);
}

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await MenuItem.find({ userId: session.user.id });
  return NextResponse.json(items);
}

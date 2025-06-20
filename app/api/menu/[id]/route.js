import { connectDB } from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { NextResponse } from "next/server";



export async function PUT(req, context) {
  await connectDB();

  // Await the whole params object
  const params = await context.params;

  const id = params.id;
  const data = await req.json();

  try {
    const updated = await MenuItem.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  await connectDB();

  const params = await context.params;
  const id = params.id;

  try {
    await MenuItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


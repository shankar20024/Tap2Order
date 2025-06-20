// app/api/table/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Table from "@/models/Table";
import { NextResponse } from "next/server";

export async function DELETE(req, context) {
  await connectDB();

  const { id } = await context.params; // ✅ await not needed for object destructuring

  try {
    await Table.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

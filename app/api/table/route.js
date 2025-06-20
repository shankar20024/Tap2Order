import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import {connectDB} from "@/lib/mongodb";
import Table from "@/models/Table";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { tableNumber } = await req.json();
  await connectDB();

  const newTable = await Table.create({
    tableNumber,
    userId: session.user.id,
  });

  return Response.json(newTable);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();
  const tables = await Table.find({ userId: session.user.id });

  return Response.json(tables);
}

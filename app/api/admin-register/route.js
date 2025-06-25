import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { name, email, password, tableLimit } = await req.json();
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) return new Response("User exists", { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ 
    name, 
    email, 
    password: hashed, 
    role: "user",
    tableLimit: tableLimit || 10 // Default to 10 if not provided
  });

  await newUser.save();
  return new Response("User registered", { status: 201 });
}

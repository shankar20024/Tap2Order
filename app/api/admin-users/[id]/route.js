import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";  // password hashing ke liye

async function checkAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET(req, { params }) {
  const session = await checkAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();
  const user = await User.findById(params.id);
  if (!user) return new Response("User not found", { status: 404 });

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const session = await checkAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { name, email, role, password } = await req.json();
  await connectDB();

  try {
    const user = await User.findById(id);
    if (!user) return new Response("User not found", { status: 404 });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ["admin", "user"].includes(role)) user.role = role;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    return new Response("User updated successfully", { status: 200 });
  } catch (error) {
    return new Response("Failed to update user", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await checkAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();

  try {
    const user = await User.findById(params.id);
    if (!user) return new Response("User not found", { status: 404 });

    await User.deleteOne({ _id: params.id });
    return new Response("User deleted successfully", { status: 200 });
  } catch (error) {
    return new Response("Failed to delete user", { status: 500 });
  }
}

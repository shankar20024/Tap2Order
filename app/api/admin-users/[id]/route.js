import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

async function checkAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await checkAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();
  const user = await User.findById(id);
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

  const body = await req.json();
  
  const { name, email, role, password, tableLimit, staffLimit, isActive, businessName, businessType, phone, hotelPhone, address } = body;
  
  console.log("🔧 PUT request for user ID:", id);
  console.log("🔧 Request body:", body);
  
  await connectDB();

  try {
    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found for ID:", id);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    console.log("✅ User found:", user.email);

    const updates = {
      name,
      email,
      role,
      tableLimit,
      staffLimit,
      isActive,
      businessName,
      businessType,
      phone,
      hotelPhone,
      address
    };

    if (password && password.trim() !== '') {
      updates.password = password; // Store plain text password
      console.log("🔐 Password update included");
    }

    console.log("🔧 Updates to apply:", updates);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("❌ Failed to update user");
      return new Response(JSON.stringify({ error: "Failed to update user" }), { status: 500 });
    }

    console.log("✅ User updated successfully:", updatedUser.email);

    return new Response(JSON.stringify({
      message: "User updated successfully",
      user: updatedUser
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("❌ PUT Error details:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    return new Response(JSON.stringify({ 
      error: "Failed to update user",
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const session = await checkAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();

  try {
    const user = await User.findById(id);
    if (!user) return new Response("User not found", { status: 404 });

    await User.deleteOne({ _id: id });
    return new Response("User deleted successfully", { status: 200 });
  } catch (error) {
    return new Response("Failed to delete user", { status: 500 });
  }
}

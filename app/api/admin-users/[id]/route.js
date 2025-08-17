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

  const body = await req.json();
  console.log('Received update request for user:', id, 'with data:', body);
  
  const { name, email, role, password, tableLimit, staffLimit, isActive, businessName, businessType, phone, hotelPhone, address } = body;
  
  await connectDB();

  try {
    const user = await User.findById(id);
    if (!user) {
      console.log('User not found:', id);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Log current user data before update
    console.log('User before update:', {
      _id: user._id,
      isActive: user.isActive,
      email: user.email
    });

    // Update only the fields that are provided
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role && ["admin", "user"].includes(role)) updates.role = role;
    if (tableLimit !== undefined) updates.tableLimit = parseInt(tableLimit) || 10;
    if (staffLimit !== undefined) {
      const s = parseInt(staffLimit);
      updates.staffLimit = Math.min(50, Math.max(1, Number.isNaN(s) ? 5 : s));
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (businessName !== undefined) updates.businessName = businessName;
    if (businessType !== undefined) updates.businessType = businessType;
    if (phone !== undefined) updates.phone = phone;
    if (hotelPhone !== undefined) updates.hotelPhone = hotelPhone;
    if (address && typeof address === 'object') {
      updates.address = {
        street: address.street ?? user.address?.street ?? "",
        city: address.city ?? user.address?.city ?? "",
        state: address.state ?? user.address?.state ?? "",
        zipCode: address.zipCode ?? user.address?.zipCode ?? "",
        country: address.country ?? user.address?.country ?? "India",
      };
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    console.log('Updating user with:', updates);

    // Use findByIdAndUpdate with { new: true } to return the updated document
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('Failed to update user:', id);
      return new Response(JSON.stringify({ error: "Failed to update user" }), { status: 500 });
    }

    console.log('User after update:', {
      _id: updatedUser._id,
      isActive: updatedUser.isActive,
      email: updatedUser.email
    });

    // Return the updated user data
    return new Response(JSON.stringify({
      message: "User updated successfully",
      user: updatedUser
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error updating user:", error);
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

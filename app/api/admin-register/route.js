import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { generateHotelCode } from "@/lib/hotelCodeGenerator";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const {
      name,
      email,
      password,
      role,
      tableLimit,
      staffLimit,
      businessName,
      businessType,
      phone, // owner phone
      hotelPhone,
      address = {}, // { street, city, state, zipCode, country }
    } = await req.json();
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return new Response("User exists", { status: 400 });

    const userRole = role || "user";
    let hotelCode = null;
    
    // Generate unique hotel code only for hotel owners (user role)
    if (userRole === "user") {
      hotelCode = await generateHotelCode();
    }
    
    const newUser = new User({ 
      name, 
      email, 
      password: password, 
      role: userRole,
      tableLimit: tableLimit || 10,
      // Only meaningful for hotel owners; default 5 and clamp to 1..50
      ...(userRole === "user"
        ? (() => {
            const s = parseInt(staffLimit ?? 5);
            const clamped = Math.min(50, Math.max(1, Number.isNaN(s) ? 5 : s));
            return { staffLimit: clamped };
          })()
        : {}),
      ...(hotelCode && { hotelCode }), 
      createdBy: session.user.id,
      businessName: businessName || name, 
      businessType: businessType || "restaurant",
      phone: phone || "",
      hotelPhone: hotelPhone || "",
      address: {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country || "India",
      },
    });

    await newUser.save();
    
    // Return the created user object for local state update
    const userObject = newUser.toObject();
    
    return new Response(JSON.stringify({
      message: "User registered successfully",
      _id: userObject._id,
      name: userObject.name,
      email: userObject.email,
      role: userObject.role,
      tableLimit: userObject.tableLimit,
      staffLimit: userObject.staffLimit,
      businessName: userObject.businessName,
      businessType: userObject.businessType,
      phone: userObject.phone,
      hotelPhone: userObject.hotelPhone,
      hotelCode: userObject.hotelCode,
      isActive: userObject.isActive !== false,
      address: userObject.address,
      createdAt: userObject.createdAt
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(error.message || "Failed to create user", { status: 500 });
  }
}

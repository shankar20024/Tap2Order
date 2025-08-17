import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import jwt from "jsonwebtoken";

/**
 * Staff Login API - Authenticate staff with 4-digit passcode and hotel selection
 * 
 * This endpoint handles staff authentication using their unique 4-digit passcode
 * and validates they belong to the selected hotel.
 */
export async function POST(req) {
  try {
    const { passcode, hotelId } = await req.json();

    // Validate passcode format
    if (!passcode || !/^\d{4}$/.test(passcode)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid passcode format. Please enter 4 digits." 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate hotel selection
    if (!hotelId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Please select a hotel." 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 Staff login attempt:', { passcode, hotelId });
    
    await connectDB();

    // Passcodes are stored as plaintext 4-digits by explicit request.
    // We can directly look up the staff by passcode + hotel.
    const staff = await Staff.findOne({
      passcode,
      hotelOwner: hotelId,
      isActive: true,
    }).populate('hotelOwner', 'name email hotelCode businessName');

    if (!staff) {
      console.log('❌ No active staff found with passcode for selected hotel');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid passcode or you don't work at the selected hotel." 
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Staff found:', {
      name: staff.name,
      position: staff.position,
      hotel: staff.hotelOwner?.businessName || staff.hotelOwner?.name
    });

    // Create email if staff doesn't have one (local alias)
    const staffEmail = staff.email || `staff_${staff.employeeId}@${staff.hotelOwner.hotelCode?.toLowerCase() || 'hotel'}.local`;

    // Determine staff role for routing
    let staffRole = "staff";
    if (staff.position === "waiter") {
      staffRole = "waiter";
    } else if (staff.position === "chef") {
      staffRole = "kitchen";
    } else if (staff.position === "manager") {
      staffRole = "manager";
    }

    // Update staff last login
    staff.lastLogin = new Date();
    await staff.save();

    // Issue a short-lived staff token to be consumed by NextAuth Credentials authorize()
    const payload = {
      id: staff._id.toString(),
      name: staff.name,
      email: staffEmail,
      role: staffRole,
      staffId: staff._id.toString(),
      hotelOwner: staff.hotelOwner._id.toString(),
      hotelCode: staff.hotelOwner.hotelCode,
      position: staff.position,
      isStaff: true,
      iat: Math.floor(Date.now() / 1000)
    };
    const staffToken = jwt.sign(payload, process.env.NEXTAUTH_SECRET, { expiresIn: '30m' });

    const response = {
      success: true,
      message: "Staff login successful",
      staff: {
        id: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        position: staff.position,
        department: staff.department,
        role: staffRole,
        email: staffEmail,
        hotelOwner: staff.hotelOwner._id,
        hotelCode: staff.hotelOwner.hotelCode,
        hotelName: staff.hotelOwner.businessName || staff.hotelOwner.name,
        permissions: staff.permissions || []
      },
      staffToken
    };

    console.log('🎉 Staff login successful for:', staff.name, 'at', staff.hotelOwner.businessName);

    return new Response(
      JSON.stringify(response), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Staff login error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Staff login failed. Please try again.",
        details: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

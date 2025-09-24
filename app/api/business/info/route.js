import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: "Missing userId parameter",
        code: "MISSING_USER_ID"
      }, { status: 400 });
    }

    // Find user by ID and return business info including GST details
    const user = await User.findById(userId).select('businessName gstDetails fssaiDetails businessDetails businessType phone address');
    
    if (!user) {
      return NextResponse.json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      }, { status: 404 });
    }

    const businessInfo = {
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
      gstDetails: user.gstDetails || {},
      fssaiDetails: user.fssaiDetails || {},
      businessDetails: user.businessDetails || {},
      businessType: user.businessType || ''
    };

    return NextResponse.json(businessInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: "Server error",
      details: error.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

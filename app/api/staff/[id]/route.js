import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import { User } from "@/models/User";

function generate4DigitPasscode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const staff = await Staff.findOne({ _id: id, hotelOwner: session.user.id })
      .select('+passcode')
      .lean({ virtuals: true });
    if (!staff) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("/api/staff/[id] GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const updates = await req.json();

    // Whitelist updatable fields
    const allowed = [
      "name",
      "position",
      "department",
      "phone",
      "email",
      "isActive",
      "salary",
      "workingHours",
      "workingDays",
      "address",
      "permissions",
      "passcode",
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    // Validate passcode format if provided
    if (Object.prototype.hasOwnProperty.call(safeUpdates, "passcode")) {
      if (!/^\d{4}$/.test(String(safeUpdates.passcode || ""))) {
        return NextResponse.json({ success: false, error: "Passcode must be 4 digits" }, { status: 400 });
      }
      // Enforce uniqueness per hotel (exclude current staff id)
      const exists = await Staff.exists({
        hotelOwner: session.user.id,
        passcode: safeUpdates.passcode,
        _id: { $ne: id },
      });
      if (exists) {
        return NextResponse.json({ success: false, error: "Passcode already in use for this hotel" }, { status: 400 });
      }
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: id, hotelOwner: session.user.id },
      { $set: safeUpdates },
      { new: true }
    );

    if (!staff) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("/api/staff/[id] PUT error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Only support reset_passcode action for now
    if (body?.action !== "reset_passcode") {
      return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
    }

    const existing = await Staff.findOne({ _id: id, hotelOwner: session.user.id });
    if (!existing) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

    // Generate a unique passcode for this hotel
    let newPasscode = generate4DigitPasscode();
    for (let i = 0; i < 30; i++) {
      const clash = await Staff.exists({ hotelOwner: session.user.id, passcode: newPasscode, _id: { $ne: id } });
      if (!clash) break;
      newPasscode = generate4DigitPasscode();
    }

    const updated = await Staff.findOneAndUpdate(
      { _id: id, hotelOwner: session.user.id },
      { $set: { passcode: newPasscode } },
      { new: true, runValidators: true }
    ).select('+passcode').lean({ virtuals: true });

    return NextResponse.json({ success: true, newPasscode, staff: updated });
  } catch (error) {
    console.error("/api/staff/[id] POST error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { confirmDelete = false, deactivateOnly = false } = body || {};

    const staff = await Staff.findOne({ _id: id, hotelOwner: session.user.id });
    if (!staff) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

    if (deactivateOnly) {
      staff.isActive = false;
      await staff.save();
      return NextResponse.json({ success: true, message: "Staff deactivated" });
    }

    if (!confirmDelete) {
      return NextResponse.json({ success: false, error: "Confirmation required" }, { status: 400 });
    }

    await Staff.deleteOne({ _id: id, hotelOwner: session.user.id });

    // decrement owner's currentStaffCount and pull relation
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { currentStaffCount: -1 },
      $pull: { staff: id },
    });

    return NextResponse.json({ success: true, message: "Staff deleted" });
  } catch (error) {
    console.error("/api/staff/[id] DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

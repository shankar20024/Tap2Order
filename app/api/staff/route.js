import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import { User } from "@/models/User";

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function buildSearchQuery(search) {
  if (!search) return {};
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return {
    $or: [
      { name: regex },
      { employeeId: regex },
      { email: regex },
      { phone: regex },
    ],
  };
}

function generateEmployeeId(prefix = "EMP") {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${rand}`;
}

function generate4DigitPasscode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function generateUniquePasscodeForHotel(hotelOwnerId) {
  // Try up to 30 times to find an unused code
  for (let i = 0; i < 30; i++) {
    const code = generate4DigitPasscode();
    const exists = await Staff.exists({ hotelOwner: hotelOwnerId, passcode: code });
    if (!exists) return code;
  }
  // Fallback: exhaustive check (rare)
  throw new Error("Unable to generate unique passcode. Try again.");
}

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all"; // all | active | inactive
    const department = url.searchParams.get("department") || "all";
    const position = url.searchParams.get("position") || "all";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);

    const baseQuery = { hotelOwner: session.user.id };

    // status filter
    if (status !== "all") {
      baseQuery.isActive = status === "active";
    }
    // department filter
    if (department !== "all") {
      baseQuery.department = department;
    }
    // position filter
    if (position !== "all") {
      baseQuery.position = position;
    }

    const searchQuery = buildSearchQuery(search);
    const query = Object.keys(searchQuery).length ? { ...baseQuery, ...searchQuery } : baseQuery;

    const skip = (page - 1) * limit;

    const [items, totalCount, user] = await Promise.all([
      Staff.find(query)
        .select('+passcode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Staff.countDocuments(query),
      User.findById(session.user.id).select("staffLimit currentStaffCount"),
    ]);

    const activeCount = await Staff.countDocuments({ hotelOwner: session.user.id, isActive: true });

    return NextResponse.json({
      success: true,
      staff: items,
      stats: {
        total: totalCount,
        active: activeCount,
        limit: user?.staffLimit || 0,
        // Available slots should reflect how many ACTIVE staff are allowed
        available: Math.max(0, (user?.staffLimit || 0) - activeCount),
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error("/api/staff GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      position = "waiter",
      department = "service",
      phone,
      email,
      passcode, // optional; if not provided, generate
    } = body || {};

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Enforce limit based on ACTIVE staff count, not stored counter
    const activeCount = await Staff.countDocuments({ hotelOwner: session.user.id, isActive: true });
    if (activeCount >= user.staffLimit) {
      return NextResponse.json({ success: false, error: "Staff limit reached" }, { status: 400 });
    }

    const employeeId = generateEmployeeId();
    let rawPasscode = passcode;
    if (rawPasscode) {
      // If provided by user, enforce uniqueness in same hotel
      const exists = await Staff.exists({ hotelOwner: session.user.id, passcode: rawPasscode });
      if (exists) {
        return NextResponse.json({ success: false, error: "Passcode already in use for this hotel" }, { status: 400 });
      }
    } else {
      // Auto-generate a unique 4-digit passcode
      rawPasscode = await generateUniquePasscodeForHotel(session.user.id);
    }
    if (!/^\d{4}$/.test(rawPasscode)) {
      return NextResponse.json({ success: false, error: "Passcode must be 4 digits" }, { status: 400 });
    }

    const staff = new Staff({
      name,
      employeeId,
      passcode: rawPasscode,
      hotelOwner: session.user.id,
      position,
      department,
      phone,
      email,
    });

    await staff.save();

    // update user's staff count and relation
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { currentStaffCount: 1 },
      $addToSet: { staff: staff._id },
    });

    return NextResponse.json({ success: true, staff, generatedPasscode: rawPasscode }, { status: 201 });
  } catch (error) {
    console.error("/api/staff POST error:", error);
    // handle duplicate key errors gracefully
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: "Duplicate field value" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

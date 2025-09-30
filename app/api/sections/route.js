import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import Section from "@/models/Section";
import { connectDB } from "@/lib/mongodb";

export async function GET(request) {
  try {
    await connectDB();
    
    // For QR menu access, don't require authentication
    // Check if this is a QR menu request (no auth header)
    const authHeader = request.headers.get('authorization');
    const isQRRequest = !authHeader;
    
    if (!isQRRequest) {
      const { user, error } = await getAuthUser(request);
      if (error) {
        return NextResponse.json({ error }, { status: 401 });
      }
    }

    // Fetch ALL sections (global/shared across all users)
    const sections = await Section.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    // Check if section already exists globally
    const existingSection = await Section.findOne({ 
      name: name.trim() 
    });

    if (existingSection) {
      return NextResponse.json(
        { error: "Section with this name already exists" },
        { status: 400 }
      );
    }

    // Get the next display order globally
    const lastSection = await Section.findOne({})
      .sort({ displayOrder: -1 });
    
    const displayOrder = lastSection ? lastSection.displayOrder + 1 : 1;

    const section = new Section({
      // No userId - making sections global/shared
      name: name.trim(),
      description: description?.trim() || "",
      displayOrder,
      color: color || "#f59e0b",
      icon: icon || "🍽️"
    });

    await section.save();

    return NextResponse.json({ 
      message: "Section created successfully", 
      section 
    });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Section with this name already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}

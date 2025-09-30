import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import Section from "@/models/Section";
import { connectDB } from "@/lib/mongodb";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, description, color, icon, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    // Check if another section with this name exists for this user
    const existingSection = await Section.findOne({ 
      userId: user.id, 
      name: name.trim(),
      _id: { $ne: id }
    });

    if (existingSection) {
      return NextResponse.json(
        { error: "Section with this name already exists" },
        { status: 400 }
      );
    }

    const section = await Section.findOneAndUpdate(
      { _id: id, userId: user.id },
      {
        name: name.trim(),
        description: description?.trim() || "",
        color: color || "#f59e0b",
        icon: icon || "🍽️",
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true }
    );

    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Section updated successfully", 
      section 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = params;

    const section = await Section.findOneAndDelete({ 
      _id: id, 
      userId: user.id 
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Section deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}

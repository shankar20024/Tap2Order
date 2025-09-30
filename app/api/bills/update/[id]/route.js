import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// Bill model schema (same as create route)
const BillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    _id: String,
    name: String,
    price: Number,
    selectedSize: String,
    quantity: Number,
    category: String
  }],
  customerName: String,
  customerPhone: String,
  subtotal: {
    type: Number,
    required: true
  },
  gst: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

const Bill = mongoose.models.Bill || mongoose.model("Bill", BillSchema);

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { items, customerName, customerPhone, subtotal, gst, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    // Find and update bill
    const bill = await Bill.findOneAndUpdate(
      { 
        _id: id, 
        userId: user.id 
      },
      {
        items,
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        subtotal,
        gst,
        total,
        updatedAt: new Date()
      },
      { 
        new: true 
      }
    );

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Bill updated successfully", 
      bill 
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

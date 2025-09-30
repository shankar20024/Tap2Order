import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import BillCounter from "@/models/BillCounter";
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

export async function GET(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Get today's bills
    const bills = await Bill.find({
      userId: user.id,
      date: date
    }).sort({ createdAt: -1 });

    // Get or create bill counter for today
    let billCounter = await BillCounter.findOne({
      hotelOwner: user.id,
      date: date
    });

    if (!billCounter) {
      billCounter = new BillCounter({
        hotelOwner: user.id,
        date: date,
        counter: 0
      });
      await billCounter.save();
    }

    // Calculate next token number
    const nextTokenNumber = bills.length > 0 
      ? Math.max(...bills.map(bill => bill.tokenNumber)) + 1 
      : 1;

    return NextResponse.json({ 
      bills,
      nextTokenNumber
    });
  } catch (error) {
    console.error('Error fetching today\'s bills:', error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Table from "@/models/Table"; // Import Table model
import { NextResponse } from "next/server";
import { setTableOccupied, setTableFree } from "@/lib/tableStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ably from "@/lib/ably";

// POST method to create a new order
export async function POST(req) {
  try {
    await connectDB();
    const { tableNumber, cart, userId, orderMessage, status, customerId, customerInfo } = await req.json();

    // Validate cart items
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({
        error: "Invalid cart data",
        details: "Cart must contain at least one item",
        code: "INVALID_CART"
      }, { status: 400 });
    }

    // Process cart items and calculate total
    const processedCart = cart.map(item => ({
      ...item,
      // Ensure menuItemId is a string and price is a number
      menuItemId: String(item.menuItemId || ''),
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      name: String(item.name || 'Unnamed Item'),
      notes: String(item.notes || ''),
      size: String(item.size || ''),
      subcategory: String(item.subcategory || ''),
      category: String(item.category || 'veg'), // Add category field
      status: 'pending', // All new items start as pending
    }));

    // Check for existing active order for this table (not served/completed)
    const existingOrder = await Order.findOne({
      userId: String(userId || ''),
      tableNumber: String(tableNumber || ''),
      paymentStatus: "unpaid",
      status: { $nin: ["served", "completed"] } // Only merge with active orders, not served ones
    }).sort({ createdAt: -1 });

    let savedOrder;

    // Check if order contains only beverages
    const isOnlyBeverages = processedCart.every(item => 
      item.category === 'beverages' || item.subcategory === 'beverages'
    );

    // Set initial status based on order type
    const initialStatus = status || 'pending';

    if (existingOrder) {
      // Add new items to existing order
      existingOrder.items.push(...processedCart);
      existingOrder.totalAmount += processedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Update special requests if provided
      if (orderMessage) {
        existingOrder.specialRequests = existingOrder.specialRequests 
          ? `${existingOrder.specialRequests}\n${orderMessage}` 
          : orderMessage;
      }
      
      // Update customer info if provided
      if (customerInfo) {
        existingOrder.customerInfo = {
          name: customerInfo.name || existingOrder.customerInfo.name || 'Guest',
          phone: customerInfo.phone || existingOrder.customerInfo.phone || '',
          ip: customerInfo.ip || existingOrder.customerInfo.ip || ''
        };
      }

      savedOrder = await existingOrder.save();
    } else {
      // Create new order
      const totalAmount = processedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrder = new Order({
        tableNumber: String(tableNumber || ''),
        items: processedCart,
        userId: String(userId || ''),
        specialRequests: String(orderMessage || ''),
        status: initialStatus,
        orderType: isOnlyBeverages ? 'beverages' : 'food',
        totalAmount: totalAmount,
        paymentStatus: "unpaid",
        customerId: customerId || null,
        customerInfo: {
          name: customerInfo?.name || 'Guest',
          phone: customerInfo?.phone || '',
          ip: customerInfo?.ip || ''
        }
      });
      
      savedOrder = await newOrder.save();
    }
    
    // Check if table exists
    const table = await Table.findOne({ userId, tableNumber });
    if (!table) {
      return NextResponse.json({
        error: "Table not found",
        code: "TABLE_NOT_FOUND"
      }, { status: 404 });
    }

    // Set table as occupied
    try {
      await setTableOccupied(userId, tableNumber);
    } catch (error) {
      return NextResponse.json({
        error: "Failed to set table status",
        details: error.message,
        code: "TABLE_STATUS_ERROR"
      }, { status: 500 });
    }

    // Publish real-time event to waiter dashboard
    try {
      console.log('📡 Publishing order.created event to channel:', `orders:${userId}`);
      console.log('📦 Order data:', JSON.stringify(savedOrder, null, 2));
      const channel = ably.channels.get(`orders:${userId}`);
      await channel.publish('order.created', savedOrder);
      console.log('✅ Successfully published order.created event');
    } catch (error) {
      console.error('❌ Failed to publish order created event:', error);
      // Don't fail the order creation if real-time publishing fails
    }

    return NextResponse.json({ order: savedOrder }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      error: "Server error",
      details: err.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

// GET method to fetch all orders
export async function GET(req) {
  try {
    await connectDB();
    
    // Get authentication from NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    let userId;
    
    // For staff users, use hotelOwner as userId
    if (session.user.isStaff && session.user.hotelOwner) {
      userId = session.user.hotelOwner;
    } else {
      // For regular users, use their own ID
      userId = session.user.id;
    }
    
    // Only fetch orders for this specific userId that are not completed
    const orders = await Order.find({ 
      userId: userId, 
      status: { $ne: "completed" } 
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// PATCH method to update all items in an order to preparing status
export async function PATCH(req) {
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

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({
        error: "Missing required fields",
        details: "orderId is required"
      }, { status: 400 });
    }

    // Find the order and ensure it belongs to the authenticated user
    const order = await Order.findOne({ _id: orderId, userId: userId });
    
    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        details: "Order not found or access denied"
      }, { status: 404 });
    }

    // Update all non-beverage pending items to preparing status
    const now = new Date();
    let itemsUpdated = false;
    order.items.forEach(item => {
      if (item.status === 'pending' && item.subcategory !== 'beverages') {
        item.status = 'preparing';
        item.preparedAt = now;
        itemsUpdated = true;
      }
    });

    // Update overall order status only if some items were updated
    if (itemsUpdated) {
      order.status = 'preparing';
      if (!order.preparingAt) {
        order.preparingAt = now;
      }
    }

    const updatedOrder = await order.save();

    return NextResponse.json({
      message: "All applicable items updated to preparing status",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error updating order items:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message
    }, { status: 500 });
  }
}
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// PATCH method to update individual item status
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

    const { orderId, itemId, status } = await req.json();

    if (!orderId || !itemId || !status) {
      return NextResponse.json({
        error: "Missing required fields",
        details: "orderId, itemId, and status are required"
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["pending", "preparing", "ready", "served"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: "Invalid status",
        details: `Status must be one of: ${validStatuses.join(", ")}`
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

    // Find the specific item in the order
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json({
        error: "Item not found",
        details: "Item not found in the specified order"
      }, { status: 404 });
    }

    // Update the item status and timestamp
    order.items[itemIndex].status = status;
    
    // Set appropriate timestamp based on status
    const now = new Date();
    switch (status) {
      case 'preparing':
        order.items[itemIndex].preparedAt = now;
        break;
      case 'ready':
        order.items[itemIndex].readyAt = now;
        break;
      case 'served':
        order.items[itemIndex].servedAt = now;
        break;
    }

    // Update overall order status based on item statuses
    const allItemsServed = order.items.every(item => item.status === 'served');
    const anyItemPreparing = order.items.some(item => item.status === 'preparing');
    const anyItemReady = order.items.some(item => item.status === 'ready');

    if (allItemsServed) {
      order.status = 'served';
      order.servedAt = now;
    } else if (anyItemReady) {
      order.status = 'ready';
    } else if (anyItemPreparing) {
      order.status = 'preparing';
      if (!order.preparingAt) {
        order.preparingAt = now;
      }
    }

    const updatedOrder = await order.save();

    return NextResponse.json({
      message: "Item status updated successfully",
      order: updatedOrder,
      updatedItem: updatedOrder.items[itemIndex]
    });

  } catch (error) {
    console.error("Error updating item status:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message
    }, { status: 500 });
  }
}
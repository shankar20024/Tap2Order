import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { setTableFree } from "@/lib/tableStatus";
import ably from "@/lib/ably";

// PATCH method to update order status (e.g., for pending orders)
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        error: "Missing order ID",
        code: "MISSING_ID"
      }, { status: 400 });
    }

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({
        error: "Missing status field",
        code: "MISSING_STATUS"
      }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        code: "ORDER_NOT_FOUND"
      }, { status: 404 });
    }

    // If order is being completed or cancelled, free the table
    if (status === "completed" || status === "cancelled") {
      try {
        await setTableFree(order.userId, order.tableNumber);
      } catch (error) {
        // Don't fail the order update if table status update fails
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Publish real-time event to waiter dashboard
    try {
      const channel = ably.channels.get(`orders:${updatedOrder.userId}`);
      await channel.publish('order.updated', updatedOrder);
    } catch (error) {
      // Don't fail the order update if real-time publishing fails
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: "Server error",
      details: err.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

// PUT method to mark an order as completed
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        error: "Missing order ID",
        code: "MISSING_ID"
      }, { status: 400 });
    }

    // Try to find the order without strict ID validation first
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        code: "ORDER_NOT_FOUND"
      }, { status: 404 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "completed",
        paymentStatus: "paid",
        paymentMethod: "cash",
        completedAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({
        error: "Failed to update order",
        code: "UPDATE_FAILED"
      }, { status: 500 });
    }

    await setTableFree(order.userId, order.tableNumber);

    // Publish real-time event to waiter dashboard
    try {
      const channel = ably.channels.get(`orders:${updatedOrder.userId}`);
      await channel.publish('order.updated', updatedOrder);
    } catch (error) {
      // Don't fail the order update if real-time publishing fails
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: "Server error",
      details: err.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

// DELETE method to delete an order
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || typeof id !== 'string' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({
        error: "Invalid order ID format",
        code: "INVALID_ID_FORMAT"
      }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        code: "ORDER_NOT_FOUND"
      }, { status: 404 });
    }

    await Order.findByIdAndDelete(id);
    await setTableFree(order.userId, order.tableNumber);

    // Publish delete event so all clients remove this order
    try {
      const ch = ably.channels.get(`orders:${order.userId}`);
      await ch.publish('order.deleted', { _id: id, tableNumber: order.tableNumber });
    } catch (e) {
      // Ably publish failed on order delete
    }

    return NextResponse.json({
      message: "Order deleted successfully",
      _id: id,
      status: "cancelled"
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: "Server error",
      details: err.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

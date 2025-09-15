import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { setTableFree } from "@/lib/tableStatus";
import ably from "@/lib/ably";

// GET method to fetch individual order
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        error: "Missing order ID",
        code: "MISSING_ID"
      }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        code: "ORDER_NOT_FOUND"
      }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

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
        // Publish reload event to QR page
        const reloadChannel = ably.channels.get(`table-reload:${order.userId}:${order.tableNumber}`);
        await reloadChannel.publish('reload', {});
      } catch (error) {
        // Don't fail the order update if table status update or reload fails
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
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { triggerPaymentEvent, ...updateData } = body;

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

    // If payment is being marked as paid, set status to completed
    const finalUpdateData = {
      ...updateData,
      ...(updateData.paymentStatus === 'paid' && {
        status: "completed",
        paymentMethod: "cash",
        completedAt: new Date()
      })
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      finalUpdateData,
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({
        error: "Failed to update order",
        code: "UPDATE_FAILED"
      }, { status: 500 });
    }

    // Free the table if payment is completed
    if (updateData.paymentStatus === 'paid') {
      await setTableFree(order.userId, order.tableNumber);
    }

    // Only publish reload event if it's NOT a payment completion
    if (!triggerPaymentEvent || updateData.paymentStatus !== 'paid') {
      try {
          const reloadChannel = ably.channels.get(`table-reload:${order.userId}:${order.tableNumber}`);
          await reloadChannel.publish('reload', {});
      } catch (error) {
          // Don't fail if reload publish fails
      }
    }

    // Publish real-time event to waiter dashboard
    try {
      const channel = ably.channels.get(`orders:${updatedOrder.userId}`);
      await channel.publish('order.updated', updatedOrder);
      
      // If this is a payment completion, send simple redirect command
      if (triggerPaymentEvent && updateData.paymentStatus === 'paid') {
        console.log('Publishing payment.completed event for order:', updatedOrder._id);
        
        // Send redirect command to specific table
        const tableChannel = ably.channels.get(`table:${updatedOrder.userId}:${updatedOrder.tableNumber}`);
        await tableChannel.publish('redirect-to-bill', {
          orderId: updatedOrder._id,
          tableNumber: updatedOrder.tableNumber
        });
        
        console.log('Redirect command sent to table channel');
      }
    } catch (error) {
      console.error('Failed to publish real-time events:', error);
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

    // Publish reload event to QR page
    try {
        const reloadChannel = ably.channels.get(`table-reload:${order.userId}:${order.tableNumber}`);
        await reloadChannel.publish('reload', {});
    } catch (error) {
        // Don't fail if reload publish fails
    }

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

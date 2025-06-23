import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Table from "@/models/Table"; // Import Table model
import { NextResponse } from "next/server";
import { setTableOccupied, setTableFree } from "@/lib/tableStatus";

// POST method to create a new order
export async function POST(req) {
  try {
    await connectDB();
    const { tableNumber, cart, userId, orderMessage } = await req.json();

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
      notes: String(item.notes || '')
    }));

    // Validate processed cart
    const invalidItems = processedCart.filter(item => !item.menuItemId || isNaN(item.price) || item.price <= 0);
    if (invalidItems.length > 0) {
      return NextResponse.json({
        error: "Invalid cart items",
        details: "Some items are missing required fields or have invalid prices",
        code: "INVALID_CART_ITEMS"
      }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = processedCart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

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
      console.error("Error setting table occupied:", error);
      return NextResponse.json({
        error: "Failed to set table status",
        details: error.message,
        code: "TABLE_STATUS_ERROR"
      }, { status: 500 });
    }

    const order = new Order({
      tableNumber: Number(tableNumber) || 0,
      items: processedCart,
      userId: String(userId || ''),
      message: String(orderMessage || ''),
      status: "pending",
      totalAmount,
      paymentStatus: "unpaid"
    });

    const savedOrder = await order.save();
    return NextResponse.json(savedOrder, { status: 201 });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({
      error: "Server error",
      details: err.message,
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}

// GET method to fetch all orders
export async function GET() {
  try {
    await connectDB();
    // Only fetch orders that are not completed
    const orders = await Order.find({ status: { $ne: "completed" } });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

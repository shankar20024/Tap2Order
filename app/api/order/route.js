import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Table from "@/models/Table"; // Import Table model
import { NextResponse } from "next/server";
import { setTableOccupied, setTableFree } from "@/lib/tableStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
      subcategory: String(item.subcategory || '') // Ensure subcategory is preserved
    }));

    // Separate beverages and food items
    const beverageItems = processedCart.filter(item => item.subcategory === 'beverages');
    const foodItems = processedCart.filter(item => item.subcategory !== 'beverages');
    
    const savedOrders = [];
    
    // Create beverages order if there are beverages items
    if (beverageItems.length > 0) {
      const beveragesTotalAmount = beverageItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const beveragesOrder = new Order({
        tableNumber: String(tableNumber || ''),
        items: beverageItems,
        userId: String(userId || ''),
        specialRequests: String(orderMessage || ''),
        status: 'pending', // Beverages start as pending, waiter can serve or cancel
        orderType: 'beverages',
        totalAmount: beveragesTotalAmount,
        paymentStatus: "unpaid",
        customerId: customerId || null,
        customerInfo: {
          name: customerInfo?.name || 'Guest',
          phone: customerInfo?.phone || '',
          ip: customerInfo?.ip || ''
        }
      });
      
      const savedBeveragesOrder = await beveragesOrder.save();
      savedOrders.push(savedBeveragesOrder);
    }
    
    // Create food order if there are food items
    if (foodItems.length > 0) {
      const foodTotalAmount = foodItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const foodOrder = new Order({
        tableNumber: String(tableNumber || ''),
        items: foodItems,
        userId: String(userId || ''),
        specialRequests: String(orderMessage || ''),
        status: status || 'pending', // Food follows normal workflow
        orderType: 'food',
        totalAmount: foodTotalAmount,
        paymentStatus: "unpaid",
        customerId: customerId || null,
        customerInfo: {
          name: customerInfo?.name || 'Guest',
          phone: customerInfo?.phone || '',
          ip: customerInfo?.ip || ''
        }
      });
      
      const savedFoodOrder = await foodOrder.save();
      savedOrders.push(savedFoodOrder);
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

    // Return the first order for compatibility with existing code
    return NextResponse.json({ order: savedOrders[0] }, { status: 201 });
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

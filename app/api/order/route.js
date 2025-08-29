import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Table from "@/models/Table"; // Import Table model
import { User } from "@/models/User"; // Import User model for GST details
import { NextResponse } from "next/server";
import { setTableOccupied, setTableFree } from "@/lib/tableStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ably from "@/lib/ably";

// POST method to create a new order
export async function POST(req) {
  try {
    await connectDB();
    const { tableNumber, cart, userId, orderMessage, status, customerId, customerInfo, totalAmount: frontendTotalAmount, gstDetails } = await req.json();

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
      status: { $nin: [ "completed", "cancelled"] } // Only merge with active orders, not served ones
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

      // Re-evaluate orderType. If any item is not a beverage, it's a food order.
      const hasFoodItems = existingOrder.items.some(item => item.category !== 'beverages');
      if (hasFoodItems) {
        existingOrder.orderType = 'food';
      }

      // Calculate the subtotal of the new items
      const newItemsSubtotal = processedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Add the new subtotal to the existing totalAmount
      existingOrder.totalAmount += newItemsSubtotal;

      // If new GST details are provided, update the existing ones by adding the new values
      if (gstDetails && existingOrder.gstDetails) {
        existingOrder.gstDetails.subtotal += gstDetails.subtotal || 0;
        existingOrder.gstDetails.cgstAmount += gstDetails.cgstAmount || 0;
        existingOrder.gstDetails.sgstAmount += gstDetails.sgstAmount || 0;
        existingOrder.gstDetails.totalGst += gstDetails.totalGst || 0;
        existingOrder.gstDetails.grandTotal += gstDetails.grandTotal || 0;
      } else if (gstDetails) {
        // If the existing order didn't have GST but the new one does
        existingOrder.gstDetails = gstDetails;
      }

      // Ensure totalAmount reflects the grandTotal if GST is applied
      if (existingOrder.gstDetails && existingOrder.gstDetails.isGstApplicable) {
        existingOrder.totalAmount = existingOrder.gstDetails.grandTotal;
      }

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
      const totalAmount = frontendTotalAmount || processedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrder = new Order({
        tableNumber: String(tableNumber || ''),
        items: processedCart,
        userId: String(userId || ''),
        specialRequests: String(orderMessage || ''),
        status: initialStatus,
        orderType: isOnlyBeverages ? 'beverages' : 'food',
        totalAmount: totalAmount,
        gstDetails: gstDetails, // Save the provided GST details
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
      const channel = ably.channels.get(`orders:${userId}`);
      await channel.publish('order.created', savedOrder);
    } catch (error) {
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
    
    // Fetch user's business profile for GST details
    let user, taxRate = 0, hasGstNumber = false;
    try {
      user = await User.findOne({ _id: userId });
      taxRate = user?.gstDetails?.taxRate || 0;
      hasGstNumber = user?.gstDetails?.gstNumber && user.gstDetails.gstNumber.trim() !== '';
    } catch (userError) {
      // Continue without GST calculation if user fetch fails
    }
    
    // Only fetch orders for this specific userId that are not completed or cancelled
    const orders = await Order.find({ 
      userId: userId, 
      status: { $nin: ["completed", "cancelled"] } 
    });
    
    // Calculate grand total with GST for each order
    const ordersWithGST = orders.map(order => {
      try {
        const orderObj = order.toObject();
        const subtotal = orderObj.totalAmount || (orderObj.items || orderObj.cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Apply GST only if user has GST number and tax rate > 0
        if (hasGstNumber && taxRate > 0) {
          const gstAmount = subtotal * (taxRate / 100);
          const grandTotal = subtotal + gstAmount;
          
          return {
            ...orderObj,
            gstDetails: {
              subtotal: subtotal,
              cgstAmount: gstAmount / 2,
              sgstAmount: gstAmount / 2,
              totalGst: gstAmount,
              grandTotal: grandTotal,
              isGstApplicable: true,
              taxRate: taxRate
            }
          };
        } else {
          return {
            ...orderObj,
            gstDetails: {
              subtotal: subtotal,
              cgstAmount: 0,
              sgstAmount: 0,
              totalGst: 0,
              grandTotal: subtotal,
              isGstApplicable: false,
              taxRate: 0
            }
          };
        }
      } catch (orderError) {
        // Return original order if GST calculation fails
        return order.toObject();
      }
    });
    
    return NextResponse.json(ordersWithGST);
  } catch (error) {
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}

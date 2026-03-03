import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Table from "@/models/Table"; // Import Table model
import { User } from "@/models/User"; // Import User model for GST details
import { BillCounter, Bill } from "@/models/BillCounter"; // Import Bill models
import { NextResponse } from "next/server";
import { setTableOccupied, setTableFree } from "@/lib/tableStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ably from "@/lib/ably";
import { checkSubscription, requireActiveSubscription } from "@/lib/subscription-middleware";

// Helper function to create bill for order
async function createBillForOrder(order, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get or create bill counter for today
    let billCounter = await BillCounter.findOne({
      hotelOwner: userId,
      date: today
    });

    if (!billCounter) {
      // New day - create counter starting from 0 (so first token will be 1)
      billCounter = new BillCounter({
        hotelOwner: userId,
        date: today,
        counter: 0
      });
      console.log(`New day detected: Token counter reset for ${today}`);
    }

    // Increment counter
    billCounter.counter += 1;
    await billCounter.save();

    // Generate unique bill number with retry logic
    let finalBillNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const testBillNumber = `${today.replace(/-/g, '')}-${billCounter.counter.toString().padStart(4, '0')}`;
      const existingBill = await Bill.findOne({ billNumber: testBillNumber });
      
      if (!existingBill) {
        finalBillNumber = testBillNumber;
        break;
      }
      
      billCounter.counter += 1;
      await billCounter.save();
      attempts++;
    }

    if (!finalBillNumber) {
      throw new Error("Unable to generate unique bill number");
    }

    // Map orderType to valid Bill enum values
    const mapOrderType = (orderType) => {
      const validTypes = ['dine-in', 'takeaway', 'billing', 'delivery'];
      if (validTypes.includes(orderType)) {
        return orderType;
      }
      // Default mapping for invalid types
      return 'dine-in';
    };

    // Create bill with order data
    const bill = new Bill({
      billNumber: finalBillNumber,
      tokenNumber: order.tokenNumber || billCounter.counter,
      userId: userId,
      orderId: order._id, // Add order ID reference
      orderType: mapOrderType(order.orderType),
      tableNumber: order.tableNumber,
      items: order.items.map(item => ({
        _id: item.menuItemId,
        name: item.name,
        price: item.price,
        selectedSize: item.selectedSize || 'Regular',
        quantity: item.quantity || 1,
        category: item.category,
        subcategory: item.subcategory
      })),
      customerInfo: {
        name: order.customerInfo?.name || 'Guest',
        phone: order.customerInfo?.phone || '',
        email: '',
        address: ''
      },
      pricing: {
        subtotal: order.gstDetails?.subtotal || order.totalAmount || 0,
        gst: order.gstDetails?.totalGst || 0,
        discount: 0,
        total: order.gstDetails?.grandTotal || order.totalAmount || 0
      },
      paymentInfo: {
        method: order.paymentMethod || 'cash',
        status: order.paymentStatus === 'paid' ? 'completed' : 'pending',
        transactionId: ''
      },
      date: today,
      status: 'pending', // Will be updated when order is completed
      notes: order.orderMessage || '',
      printCount: 0
    });

    await bill.save();

    // Update order with bill number and token number (only for billing orders)
    order.billNumber = finalBillNumber;
    // Only set token number for billing orders, not takeaway/dine-in
    if (order.orderType === 'billing') {
      order.tokenNumber = billCounter.counter;
    }
    await order.save();

    return bill;
  } catch (error) {
    console.error('Error in createBillForOrder:', error);
    throw error;
  }
}

// POST method to create a new order
export async function POST(req) {
  try {
    await connectDB();

    const { tableNumber, cart, userId, orderMessage, status, customerId, customerInfo, totalAmount: frontendTotalAmount, gstDetails, orderType, paymentStatus } = await req.json();

    // Check if this is a QR order (no authentication session)
    const isQROrder = !req.headers.get('authorization') && !req.cookies.get('next-auth.session-token');

    if (!isQROrder) {
      // For authenticated orders (from dashboard/staff), apply subscription checks
      const subscriptionCheck = await checkSubscription(req, {}, () => {});
      if (!subscriptionCheck.success) {
        return NextResponse.json(
          { error: subscriptionCheck.error, code: subscriptionCheck.code },
          { status: subscriptionCheck.status }
        );
      }

      // Require active subscription for creating orders
      const activeCheck = await requireActiveSubscription(req, {}, () => {});
      if (!activeCheck.success) {
        return NextResponse.json(
          { error: activeCheck.error, code: activeCheck.code },
          { status: activeCheck.status }
        );
      }
    }

    // Validate cart items
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({
        error: "Invalid cart data",
        details: "Cart must contain at least one item",
        code: "INVALID_CART"
      }, { status: 400 });
    }

    // Check if this is a takeaway order
    const isTakeawayOrder = orderType === 'takeaway' || String(tableNumber || '').toLowerCase() === 'takeaway';

    // Helper function to normalize category for schema validation
    const normalizeCategory = (item) => {
      const validCategories = ["veg", "non-veg", "jain", "beverages", "none"];
      const category = String(item.category || '').toLowerCase();
      
      if (validCategories.includes(category)) {
        return category;
      }
      
      // Check subcategory for beverages
      if (String(item.subcategory || '').toLowerCase() === 'beverages') {
        return 'beverages';
      }
      
      // Fallback to veg boolean if available
      if (typeof item.veg === 'boolean') {
        return item.veg ? 'veg' : 'non-veg';
      }
      
      // Default fallback
      return 'veg';
    };

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
      category: normalizeCategory(item), // Use normalized category for schema validation
      status: 'pending', // All new items start as pending
    }));

    // Check for existing active order for this table (not served/completed)
    // Skip order merging for takeaway orders
    const existingOrder = !isTakeawayOrder ? await Order.findOne({
      userId: String(userId || ''),
      tableNumber: String(tableNumber || ''),
      paymentStatus: "unpaid",
      status: { $nin: [ "completed", "cancelled"] } // Only merge with active orders, not served ones
    }).sort({ createdAt: -1 }) : null;

    let savedOrder;

    // Check if order contains only beverages
    const isOnlyBeverages = processedCart.every(item => 
      item.category === 'beverages' || item.subcategory === 'beverages'
    );

    // Set initial status based on order type
    const initialStatus = isTakeawayOrder ? (status || 'completed') : (status || 'pending');

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
        tableNumber: isTakeawayOrder ? 'Takeaway' : String(tableNumber || ''),
        items: processedCart,
        userId: String(userId || ''),
        specialRequests: String(orderMessage || ''),
        status: initialStatus,
        orderType: isTakeawayOrder ? 'takeaway' : (isOnlyBeverages ? 'beverages' : 'food'),
        totalAmount: totalAmount,
        gstDetails: gstDetails, // Save the provided GST details
        paymentStatus: isTakeawayOrder ? (paymentStatus || 'paid') : "unpaid",
        isTakeAway: isTakeawayOrder, // Set isTakeAway flag for takeaway orders
        customerId: customerId || null,
        customerInfo: {
          name: customerInfo?.name || 'Guest',
          phone: customerInfo?.phone || '',
          ip: customerInfo?.ip || ''
        }
      });
      
      savedOrder = await newOrder.save();
    }
    
    // For non-takeaway orders, check table exists and set occupied
    if (!isTakeawayOrder) {
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
    }

    // Create bill entry only for specific order types (not for waiter manual orders)
    const shouldCreateBill = savedOrder.orderType === 'billing' || savedOrder.orderType === 'takeaway';
    
    if (shouldCreateBill) {
      try {
        const bill = await createBillForOrder(savedOrder, userId);
        // Refresh the saved order to get the updated billNumber
        savedOrder = await Order.findById(savedOrder._id);
        console.log('Bill created for order:', bill.billNumber);
        console.log('Updated order with bill number:', savedOrder.billNumber);
      } catch (billError) {
        console.error('Error creating bill for order:', billError);
        // Don't fail order creation if bill creation fails
      }
    } else {
      console.log('Skipping bill creation for orderType:', savedOrder.orderType);
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
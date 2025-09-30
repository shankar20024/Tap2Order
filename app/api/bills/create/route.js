import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import { BillCounter, Bill } from "@/models/BillCounter";
import Order from "@/models/Order";
import { User } from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }
    const body = await request.json();
    const { 
      tokenNumber, 
      items, 
      customerName, 
      customerPhone, 
      subtotal, 
      gst, 
      total,
      orderType = 'billing',
      tableNumber = null,
      paymentMethod = 'cash',
      notes = '',
      orderId = null // Add orderId field
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get or create bill counter for today
    let billCounter = await BillCounter.findOne({
      hotelOwner: user.id,
      date: today
    });

    if (!billCounter) {
      // New day - create counter starting from 0 (so first token will be 1)
      billCounter = new BillCounter({
        hotelOwner: user.id,
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
      
      // If exists, increment counter and try again
      billCounter.counter += 1;
      await billCounter.save();
      attempts++;
    }

    if (!finalBillNumber) {
      return NextResponse.json(
        { error: "Unable to generate unique bill number" },
        { status: 500 }
      );
    }

    // Get user's GST rate for proper calculation
    let userGstRate = 0;
    try {
      const userDoc = await User.findById(user.id);
      userGstRate = userDoc?.gstDetails?.taxRate || 0;
      console.log('User GST rate from database:', userGstRate);
    } catch (error) {
      console.error('Error fetching user GST rate:', error);
    }

    // Calculate proper GST and totals using user's rate
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedGst = userGstRate > 0 ? Math.round(calculatedSubtotal * (userGstRate / 100)) : 0;
    const calculatedTotal = calculatedSubtotal + calculatedGst;
    
    console.log('GST Calculation:');
    console.log('Items subtotal:', calculatedSubtotal);
    console.log(`User GST rate: ${userGstRate}%`);
    console.log('Calculated GST:', calculatedGst);
    console.log('Calculated total:', calculatedTotal);
    console.log('Received values - subtotal:', subtotal, 'gst:', gst, 'total:', total);

    // Create bill with enhanced structure
    // Only use token number for billing app orders, not for takeaway/dashboard orders
    const shouldUseTokenNumber = orderType === 'billing' || (tokenNumber && tokenNumber > 0);
    const finalTokenNumber = shouldUseTokenNumber ? (tokenNumber || billCounter.counter) : null;
    
    console.log('Order type:', orderType);
    console.log('Should use token number:', shouldUseTokenNumber);
    console.log('Final token number:', finalTokenNumber);
    console.log('Bill counter value:', billCounter.counter);
    
    const bill = new Bill({
      billNumber: finalBillNumber,
      tokenNumber: finalTokenNumber,
      userId: user.id,
      orderId: orderId, // Add orderId to bill
      orderType,
      tableNumber,
      items: items.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        selectedSize: item.selectedSize || 'Regular',
        quantity: item.quantity || 1,
        category: item.category,
        subcategory: item.subcategory
      })),
      customerInfo: {
        name: customerName || '',
        phone: customerPhone || '',
        email: '',
        address: ''
      },
      pricing: {
        subtotal: calculatedSubtotal,
        gst: calculatedGst,
        discount: 0,
        total: calculatedTotal
      },
      paymentInfo: {
        method: paymentMethod,
        status: 'completed',
        transactionId: ''
      },
      date: today,
      status: 'completed',
      notes,
      printCount: 0
    });

    await bill.save();

    // Detect if order contains only beverages
    const isOnlyBeverages = items.every(item => item.subcategory === 'beverages');
    
    // Also create an order entry for tracking
    const order = new Order({
      tableNumber: tableNumber || 'Billing Counter',
      userId: user.id,
      customerInfo: {
        name: customerName || 'Walk-in Customer',
        phone: customerPhone || '',
        ip: ''
      },
      items: items.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        selectedSize: item.selectedSize || 'Regular',
        quantity: item.quantity || 1,
        category: item.category,
        subcategory: item.subcategory || 'main-course'
      })),
      orderType: isOnlyBeverages ? 'beverages' : 'food', // Use valid enum values
      status: 'completed', // Billing orders are immediately completed
      totalAmount: calculatedTotal,
      paymentStatus: 'paid', // Use valid enum value
      paymentMethod: paymentMethod === 'online' ? 'upi' : (paymentMethod || 'cash'), // Map to valid enum
      billNumber: finalBillNumber,
      tokenNumber: tokenNumber,
      notes: notes || ''
    });

    await order.save();

    return NextResponse.json({ 
      message: "Bill and order created successfully", 
      bill,
      order
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}

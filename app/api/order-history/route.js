import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return new Response(JSON.stringify({ error: "Date parameter is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await connectDB();

    // Convert date string to start and end of day timestamps
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate start and end of month
    const selectedDate = new Date(date);
    const startOfMonth = new Date(selectedDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(selectedDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Fetch orders for the selected date
    const dailyOrders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    // Fetch orders for the entire month
    const monthlyOrders = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate item-wise sales
    const itemSales = {};
    let dailyRevenue = 0;
    const statusCounts = {
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    // Process daily orders
    dailyOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      if (order.status === "completed") {
        order.items.forEach(item => {
          const itemTotal = item.quantity * item.price;
          dailyRevenue += itemTotal;
          
          const key = item.name;
          itemSales[key] = itemSales[key] || { 
            quantity: 0, 
            revenue: 0,
            price: item.price
          };
          itemSales[key].quantity += item.quantity;
          itemSales[key].revenue += itemTotal;
        });
      }
    });

    // Calculate monthly revenue
    let monthlyRevenue = 0;
    monthlyOrders.forEach(order => {
      if (order.status === 'completed') {
        order.items.forEach(item => {
          monthlyRevenue += item.quantity * item.price;
        });
      }
    });

    // Calculate yearly revenue
    const startOfYear = new Date(selectedDate);
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const endOfYear = new Date(selectedDate);
    endOfYear.setMonth(11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const yearlyOrders = await Order.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });

    let yearlyRevenue = 0;
    yearlyOrders.forEach(order => {
      if (order.status === 'completed') {
        order.items.forEach(item => {
          yearlyRevenue += item.quantity * item.price;
        });
      }
    });

    // Prepare response
    const response = {
      dailyOrders: dailyOrders.map(order => ({
        ...order.toObject(),
        // Calculate total for each order
        total: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      })) || [],
      itemSales: itemSales || {},
      dailyRevenue: dailyRevenue || 0,
      monthlyRevenue: monthlyRevenue || 0,
      yearlyRevenue: yearlyRevenue || 0,
      statusCounts: statusCounts || {
        pending: 0,
        completed: 0,
        cancelled: 0
      },
      date
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // Prevent caching of the response
      }
    });

  } catch (error) {
    console.error('Error in order history API:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

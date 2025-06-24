import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

// Helper function to create date in local timezone
function createLocalDate(year, month, day) {
  // Create date in local timezone
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // Get local timezone offset in minutes and convert to milliseconds
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  
  // Adjust the date by the timezone offset
  return new Date(date.getTime() - timezoneOffset);
}

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

    // Create start and end dates in local timezone
    const selectedDate = new Date(date);
    const startOfDay = createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate());
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate start and end of month
    const startOfMonth = createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
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
      // Count all statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Calculate revenue only for completed orders
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
    const startOfYear = createLocalDate(selectedDate.getFullYear(), 1, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const endOfYear = createLocalDate(selectedDate.getFullYear(), 12, 31);
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
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0'
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

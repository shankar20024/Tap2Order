import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { DateTime } from "luxon";

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

    const zone = 'Asia/Kolkata';
    const selectedDate = DateTime.fromISO(date, { zone });

    // Daily range
    const startOfDay = selectedDate.startOf('day').toJSDate();
    const endOfDay = selectedDate.endOf('day').toJSDate();

    // Monthly range
    const startOfMonth = selectedDate.startOf('month').toJSDate();
    const endOfMonth = selectedDate.endOf('month').toJSDate();

    // Yearly range
    const startOfYear = selectedDate.startOf('year').toJSDate();
    const endOfYear = selectedDate.endOf('year').toJSDate();

    // Fetch orders for the selected date
    const dailyOrders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    // Fetch orders for the entire month
    const monthlyOrders = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Fetch orders for the year
    const yearlyOrders = await Order.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });

    // Initialize counters
    const itemSales = {};
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    const statusCounts = {
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    // Daily calculations
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

    // Monthly revenue
    monthlyOrders.forEach(order => {
      if (order.status === "completed") {
        order.items.forEach(item => {
          monthlyRevenue += item.quantity * item.price;
        });
      }
    });

    // Yearly revenue
    yearlyOrders.forEach(order => {
      if (order.status === "completed") {
        order.items.forEach(item => {
          yearlyRevenue += item.quantity * item.price;
        });
      }
    });

    // Final response
    const response = {
      dailyOrders: dailyOrders.map(order => ({
        ...order.toObject(),
        total: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      })),
      itemSales,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      statusCounts,
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
    console.error("Error in order history API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

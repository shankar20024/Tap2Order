import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Strict date validation
    if (!date) {
      return new Response(JSON.stringify({ error: "Date parameter is required" }), {
        status: 400,
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(JSON.stringify({ error: "Invalid date format. Please use YYYY-MM-DD" }), {
        status: 400,
      });
    }

    // Validate date is not in future
    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate > today) {
      return new Response(JSON.stringify({ error: "Cannot fetch future dates" }), {
        status: 400,
      });
    }

    await connectDB();

    // Convert date string to start and end of day timestamps
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch orders for the selected date only
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    // Calculate statistics only for the selected date
    const itemSales = {};
    let dailyRevenue = 0;
    const statusCounts = {
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
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

    // Prepare response with only daily data
    const response = {
      orders: orders.map(order => ({
        ...order.toObject(),
        total: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      })),
      itemSales,
      dailyRevenue,
      statusCounts,
      date
    };

    return new Response(JSON.stringify(response), {
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching order history:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch order history" }), {
      status: 500,
    });
  }
}

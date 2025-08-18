// /api/order/all/route.js
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tableNumber = searchParams.get("tableNumber");
    
    if (!userId || !tableNumber) {
      return new Response(JSON.stringify({ error: "Missing userId or tableNumber parameter" }), {
        status: 400,
      });
    }

    // Find all orders for this specific user and table, excluding paid and completed orders
    const orders = await Order.find({
      userId: userId,
      tableNumber: tableNumber,
      status: { $nin: ["paid", "completed", "cancelled"] }
    }).sort({ createdAt: -1 }); // Latest orders first

    // Debug: Log fetched orders data
    console.log('[Order All API] Fetched orders count:', orders.length);
    orders.forEach((order, index) => {
      console.log(`[Order All API] Order ${index} items:`, order.items);
      order.items.forEach((item, itemIndex) => {
        console.log(`[Order All API] Order ${index} Item ${itemIndex}:`, {
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity
        });
      });
    });

    return new Response(
      JSON.stringify({
        orders: orders.map(order => ({
          id: order._id,
          items: order.items,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          tableNumber: order.tableNumber
        }))
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

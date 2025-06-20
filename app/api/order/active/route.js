import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const tableNumber = searchParams.get("tableNumber");

  if (!userId || !tableNumber) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
    });
  }

  await connectDB();

  // Find all orders that are NOT completed or cancelled
  const orders = await Order.find({
    userId,
    tableNumber,
    status: { $nin: ["completed", "cancelled"] }
  }).sort({ createdAt: -1 }); // optional: latest orders first

  return new Response(
    JSON.stringify({
      orders: orders.map(order => ({
        id: order._id,
        items: order.items,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt
      }))
    }),
    { status: 200 }
  );
}

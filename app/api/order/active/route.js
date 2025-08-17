import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const tableNumber = searchParams.get("tableNumber");
    
    if (!tableNumber) {
      return new Response(JSON.stringify({ error: "Missing tableNumber parameter" }), {
        status: 400,
      });
    }

    // Get authentication from NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }
    
    const userId = session.user.id;

    // Find all orders that are NOT completed or cancelled for this specific hotel
    const orders = await Order.find({
      userId: userId, // Use authenticated userId from session
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
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

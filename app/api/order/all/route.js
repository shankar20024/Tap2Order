// /api/order/all.js
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { userId, tableNumber } = req.query;

  try {
    await connectDB();

    const orders = await Order.find({
      userId,
      tableNumber,
      status: { $nin: ["completed", "cancelled"] },
    }).sort({ createdAt: 1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

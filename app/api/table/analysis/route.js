import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Table from "@/models/Table";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    await connectDB();

    // Get total tables count
    const totalTables = await Table.countDocuments({ userId: session.user.id });

    // Get free tables count
    const freeTables = await Table.countDocuments({ 
      userId: session.user.id,
      status: 'free'
    });

    // Get occupied tables count
    const occupiedTables = await Table.countDocuments({ 
      userId: session.user.id,
      status: 'occupied'
    });

    return Response.json({
      totalTables,
      freeTables,
      occupiedTables
    });
  } catch (error) {
    console.error("Error fetching table analysis:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      totalTables: 0,
      freeTables: 0,
      occupiedTables: 0
    }), {
      status: 500,
    });
  }
}

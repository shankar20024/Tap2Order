import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new Response("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role") || "user";

        await connectDB();
        const users = await User.find({ role });

        return new Response(JSON.stringify(users), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
}

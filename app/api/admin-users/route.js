import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import Table from "@/models/Table"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role") || "user";

        await connectDB();
        
        // First get all users
        const users = await User.find({ role });
        if (!users || users.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Get table counts for each user
        const usersWithTableCounts = await Promise.all(
            users.map(async (user) => {
                try {
                    const tableCount = await Table.countDocuments({ userId: user._id });
                    return {
                        ...user.toObject(),
                        tableCount: tableCount || 0
                    };
                } catch (error) {
                    return {
                        ...user.toObject(),
                        tableCount: 0
                    };
                }
            })
        );

        return new Response(JSON.stringify(usersWithTableCounts), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ 
                error: "Failed to fetch users",
                details: error.message 
            }), 
            { 
                headers: { "Content-Type": "application/json" },
                status: 500 
            }
        );
    }
}

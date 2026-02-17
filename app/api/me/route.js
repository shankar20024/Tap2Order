//api/me/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export async function GET(req) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Fetch user from database to get latest subscription info
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Update subscription status based on current dates
    await user.updateSubscriptionStatus();

    return new Response(
      JSON.stringify({
        id: user._id.toString(),
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        businessName: user.businessName || '',
        hotelCode: user.hotelCode || '',
        isActive: user.isActive,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        accessLevel: user.accessLevel,
        subscriptionDaysRemaining: user.subscriptionDaysRemaining,
        dataResetDaysRemaining: user.dataResetDaysRemaining
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/me:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

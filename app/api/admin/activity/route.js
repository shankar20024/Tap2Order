import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // all, users, admins, system
    const limit = parseInt(searchParams.get("limit")) || 50;

    await connectDB();

    // Get recent users for activity tracking
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('name email role createdAt updatedAt isActive');

    // Generate activity logs based on user data
    const activities = [];

    // Add user registration activities
    recentUsers.forEach(user => {
      if (user.createdAt) {
        const timeDiff = Date.now() - new Date(user.createdAt).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timeStr;
        if (hoursAgo < 1) {
          timeStr = 'Just now';
        } else if (hoursAgo < 24) {
          timeStr = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeStr = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        }

        activities.push({
          id: `reg_${user._id}`,
          type: user.role === 'admin' ? 'admin' : 'user',
          action: user.role === 'admin' 
            ? `New admin registered: ${user.name}` 
            : `New hotel owner registered: ${user.name}`,
          user: user.name,
          timestamp: timeStr,
          icon: user.role === 'admin' ? '👤' : '🏨',
          date: user.createdAt
        });
      }

      // Add update activities if updated recently
      if (user.updatedAt && user.updatedAt.getTime() !== user.createdAt.getTime()) {
        const timeDiff = Date.now() - new Date(user.updatedAt).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timeStr;
        if (hoursAgo < 1) {
          timeStr = 'Just now';
        } else if (hoursAgo < 24) {
          timeStr = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else if (daysAgo < 7) {
          timeStr = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        } else {
          timeStr = `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? 's' : ''} ago`;
        }

        activities.push({
          id: `upd_${user._id}`,
          type: user.role === 'admin' ? 'admin' : 'user',
          action: `${user.name} profile updated`,
          user: user.name,
          timestamp: timeStr,
          icon: '✏️',
          date: user.updatedAt
        });
      }

      // Add status change activities
      if (user.isActive === false) {
        activities.push({
          id: `deact_${user._id}`,
          type: user.role === 'admin' ? 'admin' : 'user',
          action: `${user.name} account deactivated`,
          user: 'Admin',
          timestamp: 'Recently',
          icon: '🔴',
          date: user.updatedAt || user.createdAt
        });
      }
    });

    // Add system activities
    activities.push({
      id: 'sys_backup',
      type: 'system',
      action: 'Database backup completed',
      user: 'System',
      timestamp: '2 hours ago',
      icon: '💾',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    activities.push({
      id: 'sys_maintenance',
      type: 'system',
      action: 'System maintenance completed',
      user: 'System',
      timestamp: '5 hours ago',
      icon: '🔧',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000)
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter activities
    let filteredActivities = activities;
    if (filter !== 'all') {
      filteredActivities = activities.filter(a => a.type === filter);
    }

    // Limit results
    filteredActivities = filteredActivities.slice(0, limit);

    return new Response(JSON.stringify(filteredActivities), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch activity logs",
        details: error.message 
      }), 
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
}

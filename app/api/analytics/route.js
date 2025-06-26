import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Table from '@/models/Table';

export async function GET() {
    console.log('Analytics API endpoint called');
    
    if (!User || typeof User.countDocuments !== 'function') {
        console.error('User model is not properly initialized:', User);
        return NextResponse.json(
            { 
                error: 'Server configuration error',
                details: 'User model is not properly initialized',
                model: User ? 'User exists but is missing methods' : 'User is undefined'
            },
            { status: 500 }
        );
    }

    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database');

        // Get total number of users (excluding admins)
        console.log('Counting users...');
        const totalUsers = await User.countDocuments({ role: 'user' });
        console.log('Total users:', totalUsers);
        
        // Get total number of admins
        console.log('Counting admins...');
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        console.log('Total admins:', totalAdmins);

        // Get all users with their table limits
        console.log('Fetching users with table limits...');
        const users = await User.find({ role: 'user' }).select('tableLimit');
        
        // Calculate total tables allowed (sum of all users' table limits)
        let totalTablesAllowed = 0;
        users.forEach(user => {
            const userLimit = Number(user.tableLimit) || 0;
            totalTablesAllowed += userLimit;
        });
        
        // Get total tables created from the Table collection
        console.log('Counting total tables...');
        const totalTablesCreated = await Table.countDocuments({});
        console.log('Total tables created:', totalTablesCreated);
        
        // Calculate tables usage percentage
        const tablesUsage = totalTablesAllowed > 0 ? Math.round((totalTablesCreated / totalTablesAllowed) * 100) : 0;
        console.log('Tables usage:', tablesUsage + '%');

        // Get recent activity (last 5 users created)
        console.log('Fetching recent activity...');
        const recentActivity = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role createdAt')
            .lean();

        console.log('Recent activity:', recentActivity);

        // Format recent activity
        const formattedActivity = recentActivity.map(user => ({
            action: `New ${user.role} created: ${user.name} (${user.email})`,
            timestamp: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown date'
        }));

        const responseData = {
            totalUsers,
            totalAdmins,
            totalTablesAllowed,
            totalTablesCreated,
            tablesUsage,
            recentActivity: formattedActivity
        };

        console.log('Sending response:', responseData);
        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error in analytics API:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch analytics data',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

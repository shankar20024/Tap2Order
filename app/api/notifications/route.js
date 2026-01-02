import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';

// GET /api/notifications - Get all notifications for the current user
export async function GET() {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await Notification.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, title, message, relatedId, metadata = {} } = await request.json();

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = new Notification({
      type,
      title,
      message,
      userId: session.user.id,
      relatedId,
      metadata,
      read: false
    });

    await notification.save();

    // TODO: Emit real-time event via WebSocket/Ably
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

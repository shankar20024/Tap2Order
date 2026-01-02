import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';

// POST /api/notifications/read - Mark notifications as read
export async function POST(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      // Mark all notifications as read for the user
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      // Mark a specific notification as read
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: session.user.id },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAll is required' },
        { status: 400 }
      );
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    });

    // TODO: Emit real-time update via WebSocket/Ably

    return NextResponse.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notification status' },
      { status: 500 }
    );
  }
}

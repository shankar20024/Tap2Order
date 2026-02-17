import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSubscriptionStatus } from '@/lib/subscription-middleware';

export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await getAuthUser(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.id;
    
    // Skip subscription check for admin users
    if (authResult.user.role === 'admin') {
      return NextResponse.json({
        accessLevel: 'full',
        subscriptionStatus: 'active',
        subscriptionDaysRemaining: -1, // Unlimited for admin
        dataResetDaysRemaining: -1, // No reset for admin
        isAdmin: true
      });
    }

    // Get subscription status
    const subscriptionStatus = await getSubscriptionStatus(userId);
    
    if (subscriptionStatus.error) {
      return NextResponse.json(
        { error: subscriptionStatus.error },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptionStatus);

  } catch (error) {
    console.error('Subscription status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

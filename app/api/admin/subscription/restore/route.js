import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import DataResetService from '@/lib/data-reset';

/**
 * Admin API for Restoring User to Trial
 * 
 * This allows admin to restore expired users to trial period
 */
export async function POST(request) {
  try {
    // Authenticate admin user
    const authResult = await getAuthUser(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, trialDays } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Restore user to trial
    const result = await DataResetService.restoreUserToTrial(
      userId, 
      authResult.user.id,
      trialDays || 30
    );

    return NextResponse.json({
      success: true,
      message: 'User restored to trial successfully',
      result
    });

  } catch (error) {
    console.error('Admin restore user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to restore user',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

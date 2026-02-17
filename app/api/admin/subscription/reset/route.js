import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import DataResetService from '@/lib/data-reset';

/**
 * Admin API for Force Resetting User Data
 * 
 * This allows admin to manually reset user data
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

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Force reset user data
    const result = await DataResetService.forceResetUserData(
      userId, 
      authResult.user.id
    );

    return NextResponse.json({
      success: true,
      message: 'User data reset successfully',
      result
    });

  } catch (error) {
    console.error('Admin data reset error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reset user data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

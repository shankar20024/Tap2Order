import { NextResponse } from 'next/server';
import DataResetService from '@/lib/data-reset';

/**
 * System Cleanup API
 * 
 * This endpoint should be called by a cron job daily to:
 * 1. Check for expired users needing data reset
 * 2. Perform automatic data cleanup
 * 3. Update subscription statuses
 * 
 * Cron Job Setup (example):
 * 0 2 * * * https://your-domain.com/api/system/cleanup
 * This runs daily at 2 AM
 */

export async function POST(request) {
  try {
    console.log('🧹 Starting scheduled system cleanup...');
    
    // Get API key from request headers for security
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'tap2order-cleanup-2024';
    
    if (apiKey !== expectedApiKey) {
      console.log('❌ Invalid API key for cleanup job');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Perform data reset for expired users
    const resetResults = await DataResetService.checkAndResetExpiredUsers();
    
    // Calculate statistics
    const stats = {
      totalProcessed: resetResults.length,
      successfulResets: resetResults.filter(r => r.success).length,
      failedResets: resetResults.filter(r => !r.success).length,
      timestamp: new Date().toISOString(),
      results: resetResults
    };
    
    console.log(`✅ Cleanup completed: ${stats.successfulResets} successful, ${stats.failedResets} failed`);
    
    return NextResponse.json({
      success: true,
      message: 'System cleanup completed successfully',
      stats
    });
    
  } catch (error) {
    console.error('❌ System cleanup failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'System cleanup failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking cleanup status
 */
export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.CLEANUP_API_KEY || 'tap2order-cleanup-2024';
    
    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      message: 'Cleanup API is active',
      lastCleanup: 'Check logs for last cleanup time',
      endpoint: 'POST /api/system/cleanup',
      cronSetup: '0 2 * * * https://your-domain.com/api/system/cleanup'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    );
  }
}

import { User } from '@/models/User';

/**
 * Subscription Middleware for API Access Control
 * 
 * Access Levels:
 * - full: Complete access (active subscription or trial)
 * - read_only: Can only view data (1 month + 15 days period)
 * - expired: No access (needs data reset)
 */

export const checkSubscription = async (req, res, next) => {
  try {
    // Skip subscription check for admin users
    if (req.user?.role === 'admin') {
      return { success: true };
    }

    // Get user ID from authenticated request
    const userId = req.user?.id || req.user?.userId || req.session?.user?.id;
    
    if (!userId) {
      return { 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        status: 401
      };
    }

    // Fetch user with subscription details
    const user = await User.findById(userId);
    if (!user) {
      return { 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        status: 401
      };
    }

    // Update subscription status based on current dates
    await user.updateSubscriptionStatus();

    // Get current access level
    const accessLevel = user.accessLevel;
    const subscriptionDaysRemaining = user.subscriptionDaysRemaining;
    const dataResetDaysRemaining = user.dataResetDaysRemaining;

    // Check access based on level and HTTP method
    const method = req.method?.toLowerCase();
    
    switch (accessLevel) {
      case 'full':
        // Complete access for all methods
        return { success: true };
        
      case 'read_only':
        // Only allow GET requests (read-only)
        if (method === 'get') {
          return { success: true };
        } else {
          return { 
            success: false,
            error: 'Subscription expired. Only read access available. Please renew your subscription.',
            code: 'SUBSCRIPTION_READ_ONLY',
            status: 403,
            subscriptionInfo: {
              accessLevel,
              subscriptionStatus: user.subscriptionStatus,
              subscriptionDaysRemaining,
              dataResetDaysRemaining,
              subscriptionExpiry: user.subscriptionExpiry,
              dataResetDate: user.dataResetDate
            }
          };
        }
        
      case 'expired':
        // No access - data needs to be reset
        return { 
          success: false,
          error: 'Subscription expired. Please contact support to renew your subscription.',
          code: 'SUBSCRIPTION_EXPIRED',
          status: 403,
          subscriptionInfo: {
            accessLevel,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionDaysRemaining,
            dataResetDaysRemaining,
            subscriptionExpiry: user.subscriptionExpiry,
            dataResetDate: user.dataResetDate
          },
          requiresDataReset: true
        };
        
      default:
        return { 
          success: false,
          error: 'Invalid subscription status',
          code: 'INVALID_SUBSCRIPTION',
          status: 403
        };
    }

  } catch (error) {
    console.error('Subscription middleware error:', error);
    return { 
      success: false,
      error: 'Subscription check failed',
      code: 'SUBSCRIPTION_ERROR',
      status: 500
    };
  }
};

/**
 * Middleware for read-only endpoints (always allows access)
 */
export const allowReadOnly = (req, res, next) => {
  next();
};

/**
 * Middleware for write operations (requires active subscription)
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user?.role === 'admin') {
      return { success: true };
    }

    const accessLevel = req.subscriptionInfo?.accessLevel;
    
    if (accessLevel !== 'full') {
      return { 
        success: false,
        error: 'Active subscription required for this operation',
        code: 'ACTIVE_SUBSCRIPTION_REQUIRED',
        status: 403,
        subscriptionInfo: req.subscriptionInfo
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Active subscription check error:', error);
    return { 
      success: false,
      error: 'Subscription validation failed',
      code: 'VALIDATION_ERROR',
      status: 500
    };
  }
};

/**
 * Get subscription status for a user
 */
export const getSubscriptionStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: 'User not found' };
    }

    // Update subscription status manually without save
    const now = new Date();
    const subscriptionExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
    const dataResetDate = user.dataResetDate ? new Date(user.dataResetDate) : null;

    // Calculate subscription status
    let subscriptionStatus = 'expired';
    let accessLevel = 'expired';
    let subscriptionDaysRemaining = 0;
    let dataResetDaysRemaining = 0;

    if (subscriptionExpiry && subscriptionExpiry > now) {
      subscriptionDaysRemaining = Math.ceil((subscriptionExpiry - now) / (1000 * 60 * 60 * 24));
      subscriptionStatus = subscriptionDaysRemaining > 0 ? 'active' : 'expired';
      accessLevel = 'full';
    }

    // Check read-only period (15 days after expiry)
    if (subscriptionExpiry && subscriptionExpiry <= now) {
      const daysSinceExpiry = Math.ceil((now - subscriptionExpiry) / (1000 * 60 * 60 * 24));
      if (daysSinceExpiry <= 15) {
        subscriptionStatus = 'read_only';
        accessLevel = 'read_only';
        subscriptionDaysRemaining = 0;
        dataResetDaysRemaining = 15 - daysSinceExpiry;
      }
    }

    // Check data reset date
    if (dataResetDate && dataResetDate > now) {
      dataResetDaysRemaining = Math.ceil((dataResetDate - now) / (1000 * 60 * 60 * 24));
    }
    
    return {
      accessLevel: accessLevel,
      subscriptionStatus: subscriptionStatus,
      subscriptionDaysRemaining: subscriptionDaysRemaining,
      dataResetDaysRemaining: dataResetDaysRemaining,
      subscriptionExpiry: user.subscriptionExpiry,
      dataResetDate: user.dataResetDate,
      isDataReset: user.isDataReset,
      lastDataReset: user.lastDataReset
    };
  } catch (error) {
    console.error('Get subscription status error:', error);
    return { error: 'Failed to get subscription status' };
  }
};

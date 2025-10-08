// Business Info Cache Utility
// Manages localStorage caching for business info to reduce API calls

const CACHE_KEY = 'tap2orders_business_info';
const SESSION_KEY = 'tap2orders_session_id';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Generate session ID for current browser session
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get current session ID or create new one
const getCurrentSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Check if cache is valid
const isCacheValid = (cacheData) => {
  if (!cacheData) return false;
  
  const now = Date.now();
  const isExpired = now - cacheData.timestamp > CACHE_DURATION;
  const isDifferentSession = cacheData.sessionId !== getCurrentSessionId();
  
  return !isExpired && !isDifferentSession;
};

// Get business info from cache
export const getCachedBusinessInfo = (userId) => {
  try {
    const cacheKey = `${CACHE_KEY}_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    if (isCacheValid(cacheData)) {
      return cacheData.data;
    } else {
      // Remove expired cache
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (error) {
        return null;
  }
};

// Save business info to cache
export const setCachedBusinessInfo = (userId, businessInfo) => {
  try {
    const cacheKey = `${CACHE_KEY}_${userId}`;
    const cacheData = {
      data: businessInfo,
      timestamp: Date.now(),
      sessionId: getCurrentSessionId(),
      userId: userId
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
        return false;
  }
};

// Fetch business info with caching
export const getBusinessInfo = async (userId) => {
  // Try to get from cache first
  const cached = getCachedBusinessInfo(userId);
  if (cached) {
    return cached;
  }
  
  // If not in cache, fetch from API
  try {
    const response = await fetch(`/api/business/info?userId=${userId}`);
    if (response.ok) {
      const businessInfo = await response.json();
      
      // Save to cache
      setCachedBusinessInfo(userId, businessInfo);
      
      return businessInfo;
    } else {
      throw new Error(`API call failed: ${response.status}`);
    }
  } catch (error) {
        return null;
  }
};

// Clear cache for specific user
export const clearBusinessInfoCache = (userId) => {
  try {
    const cacheKey = `${CACHE_KEY}_${userId}`;
    localStorage.removeItem(cacheKey);
    return true;
  } catch (error) {
        return false;
  }
};

// Clear all business info caches
export const clearAllBusinessInfoCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
        return false;
  }
};

// Get GST details specifically (commonly used)
export const getGSTDetails = async (userId) => {
  const businessInfo = await getBusinessInfo(userId);
  return businessInfo?.gstDetails || {};
};

// Check if GST is applicable
export const isGSTApplicable = async (userId) => {
  const gstDetails = await getGSTDetails(userId);
  return gstDetails.gstNumber && gstDetails.gstNumber.trim() !== '' && gstDetails.taxRate > 0;
};

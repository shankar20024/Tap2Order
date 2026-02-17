"use client";
import { useState, useEffect } from "react";
import { FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaSync, FaCrown, FaCalendarAlt, FaInfoCircle } from "react-icons/fa";

const SubscriptionStatus = ({ userId }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          console.log('Subscription data:', data); // Debug log
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSubscriptionStatus();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return null;
  }

  const { accessLevel, subscriptionStatus, subscriptionDaysRemaining, dataResetDaysRemaining } = subscriptionInfo;

  const getStatusConfig = () => {
    switch (accessLevel) {
      case 'full':
        return {
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
          textColor: 'text-white',
          icon: FaCheckCircle,
          title: subscriptionStatus === 'trial' ? 'Trial Active' : 'Subscription Active',
          description: subscriptionStatus === 'trial' 
            ? `${subscriptionDaysRemaining} days remaining in trial`
            : `${subscriptionDaysRemaining} days remaining`,
          borderColor: 'border-green-200',
          iconBg: 'bg-white/20'
        };
      
      case 'read_only':
        return {
          bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
          textColor: 'text-white',
          icon: FaExclamationTriangle,
          title: 'Read-Only Access',
          description: `Subscription expired. Data reset in ${dataResetDaysRemaining} days`,
          borderColor: 'border-amber-200',
          iconBg: 'bg-white/20'
        };
      
      case 'expired':
        return {
          bgColor: 'bg-gradient-to-r from-red-500 to-rose-600',
          textColor: 'text-white',
          icon: FaTimesCircle,
          title: 'Subscription Expired',
          description: 'Data has been reset. Please renew subscription.',
          borderColor: 'border-red-200',
          iconBg: 'bg-white/20'
        };
      
      default:
        return {
          bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          textColor: 'text-white',
          icon: FaInfoCircle,
          title: 'Unknown Status',
          description: 'Please contact support',
          borderColor: 'border-gray-200',
          iconBg: 'bg-white/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${config.borderColor} overflow-hidden transition-all duration-300 hover:shadow-xl`}>
      {/* Header */}
      <div className={`${config.bgColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.iconBg} backdrop-blur-sm`}>
              <Icon className="text-lg sm:text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{config.title}</h3>
              <p className="text-xs opacity-90">{config.description}</p>
            </div>
          </div>
          {accessLevel === 'full' && (
            <FaCrown className="text-yellow-300 text-lg sm:text-xl" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Access Level Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-600">Access Level:</span>
          <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-full ${
            accessLevel === 'full' ? 'bg-green-100 text-green-800' :
            accessLevel === 'read_only' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {accessLevel.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Days Remaining */}
        {accessLevel !== 'expired' && (
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-600">
              {accessLevel === 'read_only' ? 'Data Reset In:' : 'Days Remaining:'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">
              {accessLevel === 'read_only' ? dataResetDaysRemaining : subscriptionDaysRemaining} days
            </span>
          </div>
        )}

        {/* Important Dates */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <FaCalendarAlt className="mr-2" />
            {subscriptionInfo.subscriptionExpiry && (
              <span>Expires: {new Date(subscriptionInfo.subscriptionExpiry).toLocaleDateString()}</span>
            )}
          </div>
          {dataResetDaysRemaining && dataResetDaysRemaining > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <FaClock className="mr-2" />
              <span>Reset: {new Date(subscriptionInfo.dataResetDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {accessLevel !== 'full' && (
          <div className="border-t pt-3">
            <button
              onClick={() => window.open('/support', '_blank')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
            >
              <FaSync className="mr-2" />
              Renew Subscription
            </button>
          </div>
        )}

        {/* Warning for Read-Only */}
        {accessLevel === 'read_only' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Important Notice:</p>
                <p>Your data will be permanently deleted in {dataResetDaysRemaining} days. Renew now to save your business data.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;

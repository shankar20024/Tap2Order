"use client";
import { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaCrown } from "react-icons/fa";

const SubscriptionIndicator = ({ userId }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
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
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!subscriptionInfo) {
    return null;
  }

  const { accessLevel, subscriptionDaysRemaining } = subscriptionInfo;

  const getIndicatorConfig = () => {
    switch (accessLevel) {
      case 'full':
        return {
          bgColor: 'bg-green-500',
          borderColor: 'border-green-600',
          icon: FaCheckCircle,
          tooltip: `${subscriptionDaysRemaining} days remaining`,
          textColor: 'text-white'
        };
      case 'read_only':
        return {
          bgColor: 'bg-amber-500',
          borderColor: 'border-amber-600',
          icon: FaExclamationTriangle,
          tooltip: `${subscriptionDaysRemaining} days remaining (Read-only)`,
          textColor: 'text-white'
        };
      case 'expired':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-600',
          icon: FaTimesCircle,
          tooltip: 'Subscription expired',
          textColor: 'text-white'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-600',
          icon: FaTimesCircle,
          tooltip: 'Unknown status',
          textColor: 'text-white'
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div className="relative group">
      <div className={`w-10 h-10 ${config.bgColor} ${config.borderColor} border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 shadow-lg`}>
        <Icon className={`w-5 h-5 ${config.textColor}`} />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="font-semibold">Subscription</div>
        <div>{config.tooltip}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default SubscriptionIndicator;

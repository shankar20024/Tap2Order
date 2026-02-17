"use client";
import { useState, useEffect } from "react";

const StorageProgressBar = ({ userId }) => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        setError(null);
        const response = await fetch('/api/storage/status');

        if (!response.ok) {
          throw new Error('Failed to fetch storage data');
        }

        const data = await response.json();
        setStorageInfo(data);
      } catch (error) {
        console.error('Error fetching storage info:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStorageInfo();

      // Fetch data every 30 seconds for real-time updates
      const interval = setInterval(fetchStorageInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full h-1 bg-gray-600 rounded-full animate-pulse"></div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-1 bg-red-600 rounded-full opacity-50"></div>
    );
  }

  if (!storageInfo) {
    return null;
  }

  const { totalStorage, usedDays, storageLevel, percentageUsed } = storageInfo;

  // Calculate progress percentage
  const progressPercentage = Math.min(percentageUsed, 100);

  const getProgressColor = () => {
    if (storageLevel === 'critical') return 'from-red-500 to-red-400';
    if (storageLevel === 'warning') return 'from-yellow-500 to-yellow-400';
    return 'from-green-500 to-green-400';
  };

  const getTooltipText = () => {
    return `${usedDays}/${totalStorage} days used (${percentageUsed}%)`;
  };

  return (
    <div className="relative w-full group">
      {/* Progress Bar */}
      <div
        className="w-full h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap border border-gray-700 shadow-lg z-50">
          {getTooltipText()}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default StorageProgressBar;

"use client";
import { FaSync } from "react-icons/fa";
import { useState } from "react";

export default function RefreshButton({ onRefresh, label = 'Refresh' , className}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      className={`flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 ${className}`}
      disabled={isRefreshing}
    >
      <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : label}
    </button>
  );
}

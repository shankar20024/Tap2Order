"use client";
import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaTable, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function AnalyticsSection() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">System Analytics</h2>
        <div className="flex gap-2">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === days
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FaUsers className="text-3xl opacity-80" />
            <div className="flex items-center gap-1 text-sm">
              <FaArrowUp />
              <span>12%</span>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-1">Total Hotels</p>
          <p className="text-3xl font-bold">{analytics?.totalUsers || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FaChartLine className="text-3xl opacity-80" />
            <div className="flex items-center gap-1 text-sm">
              <FaArrowUp />
              <span>8%</span>
            </div>
          </div>
          <p className="text-green-100 text-sm mb-1">Active Hotels</p>
          <p className="text-3xl font-bold">{analytics?.activeUsers || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FaTable className="text-3xl opacity-80" />
            <div className="flex items-center gap-1 text-sm">
              <FaArrowUp />
              <span>15%</span>
            </div>
          </div>
          <p className="text-purple-100 text-sm mb-1">Total Tables</p>
          <p className="text-3xl font-bold">{analytics?.totalTables || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FaChartLine className="text-3xl opacity-80" />
            <div className="flex items-center gap-1 text-sm">
              <FaArrowDown />
              <span>3%</span>
            </div>
          </div>
          <p className="text-amber-100 text-sm mb-1">Tables in Use</p>
          <p className="text-3xl font-bold">{analytics?.tablesUsage || 0}</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">Chart visualization coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Table Usage</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity Summary</h3>
        <div className="space-y-3">
          {analytics?.recentActivity?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{activity.description}</p>
                <p className="text-xs text-slate-500">{activity.timestamp}</p>
              </div>
            </div>
          )) || (
            <p className="text-center text-slate-500 py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

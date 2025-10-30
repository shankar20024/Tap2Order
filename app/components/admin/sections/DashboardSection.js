"use client";
import React from 'react';
import { FaUsers, FaChartLine, FaTable, FaArrowUp, FaArrowDown, FaBuilding, FaUserShield } from 'react-icons/fa';

export default function DashboardSection({ analytics, users, admins }) {
  const stats = [
    {
      title: 'Total Hotel Owners',
      value: users?.length || 0,
      change: '+12%',
      isPositive: true,
      icon: FaBuilding,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Hotels',
      value: users?.filter(u => u.isActive !== false).length || 0,
      change: '+8%',
      isPositive: true,
      icon: FaUsers,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Admins',
      value: admins?.length || 0,
      change: '+2',
      isPositive: true,
      icon: FaUserShield,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Total Tables',
      value: analytics?.totalTables || 0,
      change: '+15%',
      isPositive: true,
      icon: FaTable,
      color: 'amber',
      bgGradient: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Tables in Use',
      value: analytics?.tablesUsage || 0,
      change: '+5%',
      isPositive: true,
      icon: FaChartLine,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Inactive Hotels',
      value: users?.filter(u => u.isActive === false).length || 0,
      change: '-3%',
      isPositive: false,
      icon: FaUsers,
      color: 'red',
      bgGradient: 'from-red-500 to-red-600'
    },
  ];

  const recentActivity = analytics?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.bgGradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    stat.isPositive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.isPositive ? <FaArrowUp /> : <FaArrowDown />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-slate-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{activity.description}</p>
                  <p className="text-xs text-slate-500">{activity.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md">
          <p className="font-semibold">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₹0</p>
          <p className="text-xs opacity-90 mt-1">All hotels combined</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-md">
          <p className="font-semibold">Total Orders</p>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs opacity-90 mt-1">Across all hotels</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-md">
          <p className="font-semibold">Active Hotels</p>
          <p className="text-2xl font-bold mt-2">{users?.filter(u => u.isActive !== false).length || 0}</p>
          <p className="text-xs opacity-90 mt-1">Currently operational</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-md">
          <p className="font-semibold">System Status</p>
          <p className="text-2xl font-bold mt-2">✓ Online</p>
          <p className="text-xs opacity-90 mt-1">All systems operational</p>
        </div>
      </div>
    </div>
  );
}

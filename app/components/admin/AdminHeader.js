"use client";
import React, { useState } from 'react';
import { FaBell, FaUserCircle, FaChevronDown, FaSync } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export default function AdminHeader({ 
  activeSection, 
  stats, 
  onRefresh,
  isRefreshing 
}) {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const sectionTitles = {
    dashboard: { title: 'Dashboard Overview', subtitle: 'Monitor system-wide metrics and activities' },
    users: { title: 'Hotel Owners Management', subtitle: 'Manage all registered hotel owners' },
    admins: { title: 'Admin Management', subtitle: 'Manage admin users and permissions' },
    analytics: { title: 'Analytics & Reports', subtitle: 'View comprehensive system analytics' },
    support: { title: 'Support Tickets', subtitle: 'Manage customer support requests' },
    activity: { title: 'Activity Log', subtitle: 'Track system activities and changes' },
    settings: { title: 'System Settings', subtitle: 'Configure system preferences' },
  };

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Section Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{currentSection.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{currentSection.subtitle}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all duration-300 disabled:opacity-50"
              title="Refresh Data"
            >
              <FaSync className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all duration-300">
              <FaBell className="text-lg" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                3
              </span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg transition-all duration-300 shadow-md"
              >
                <FaUserCircle className="text-2xl" />
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold">{session?.user?.name || 'Admin'}</p>
                  <p className="text-xs opacity-90">Super Admin</p>
                </div>
                <FaChevronDown className="text-xs" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors">
                    Preferences
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Total Hotels</p>
            <p className="text-2xl font-bold text-blue-700">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Total Admins</p>
            <p className="text-2xl font-bold text-purple-700">{stats?.totalAdmins || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Active Users</p>
            <p className="text-2xl font-bold text-green-700">{stats?.activeUsers || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-1">Total Tables</p>
            <p className="text-2xl font-bold text-amber-700">{stats?.totalTables || 0}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

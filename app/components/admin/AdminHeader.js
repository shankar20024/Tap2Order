"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FaBell, FaUserCircle, FaChevronDown, FaSync, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Helper function to get notification icon
function getNotificationIcon(type) {
  switch (type) {
    case 'hotel_registration':
    case 'new_signup':
      return '🏨';
    case 'support_ticket':
      return '🎫';
    case 'system_update':
    case 'system_issue':
      return '🔄';
    case 'order_update':
      return '📦';
    case 'payment_alert':
      return '💳';
    case 'verification':
      return '✅';
    default:
      return '🔔';
  }
}

export default function AdminHeader({ 
  activeSection, 
  stats, 
  onRefresh,
  isRefreshing,
  notifications = [],
  unreadCount = 0,
  onNotificationRead,
  onMarkAllRead
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (onMarkAllRead) {
      await onMarkAllRead();
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (onNotificationRead) {
      await onNotificationRead(notificationId);
    }
  };

  // Initial fetch
  useEffect(() => {
    // No need to fetch notifications here as they're passed as props
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const sectionTitles = {
    dashboard: { title: 'Dashboard Overview', subtitle: 'Monitor system-wide metrics and activities' },
    users: { title: 'Hotel Owners Management', subtitle: 'Manage all registered hotel owners' },
    admins: { title: 'Admin Management', subtitle: 'Manage admin users and permissions' },
    analytics: { title: 'Analytics & Reports', subtitle: 'View comprehensive system analytics' },
    support: { title: 'Support Tickets', subtitle: 'Manage customer support requests' },
    activity: { title: 'Activity Log', 'subtitle': 'Track system activities and changes' },
    settings: { title: 'System Settings', subtitle: 'Configure system preferences' },
  };

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;

  // Format notification time
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

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
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
              >
                <FaBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-sm">
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification._id}
                          className={`px-4 py-3 hover:bg-slate-50 ${!notification.read ? 'bg-blue-50' : ''} border-b border-slate-100 last:border-0`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification._id);
                            }
                            // Add navigation based on notification type if needed
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                              <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-slate-500 text-sm">
                        No notifications yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="font-medium text-slate-800">{session?.user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-500">{session?.user?.email}</p>
                  </div>
                  <Link 
                    href="/admin/settings/profile"
                    className="flex items-center w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <FaUserCircle className="mr-3 text-slate-500" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link 
                    href="/admin/settings/account"
                    className="flex items-center w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <FaCog className="mr-3 text-slate-500" />
                    <span>Account Settings</span>
                  </Link>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="mr-3" />
                    <span>Logout</span>
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
"use client";
import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaChevronLeft } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsSection({ notifications, onMarkAsRead, onDelete, onMarkAllRead }) {
  const [activeTab, setActiveTab] = useState('unread');
  
  const filteredNotifications = notifications.filter(notification => 
    activeTab === 'all' || (activeTab === 'unread' && !notification.read)
  );

  const getNotificationIcon = (type) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBell className="mr-2 text-blue-500" />
          Notifications
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onMarkAllRead()}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {activeTab === 'unread' ? 'unread ' : ''}notifications
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} hover:shadow transition-shadow`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">{getNotificationIcon(notification.type)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="mt-2 text-sm text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => onMarkAsRead(notification._id)}
                      className="p-1.5 text-gray-400 hover:text-green-500 rounded-full hover:bg-gray-100"
                      title="Mark as read"
                    >
                      <FaCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notification._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    title="Delete notification"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { FaFilter, FaDownload } from 'react-icons/fa';

export default function ActivitySection() {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, users, admins, system
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch activity logs
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?filter=${filter}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const exportActivities = () => {
    // Export functionality
    alert('Exporting activity logs...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Activity Log</h2>
          <p className="text-slate-600 mt-1">Track all system activities and changes</p>
        </div>
        <button
          onClick={exportActivities}
          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <FaDownload />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
          }`}
        >
          All Activities
        </button>
        <button
          onClick={() => setFilter('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'users'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
          }`}
        >
          User Activities
        </button>
        <button
          onClick={() => setFilter('admins')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'admins'
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
          }`}
        >
          Admin Activities
        </button>
        <button
          onClick={() => setFilter('system')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'system'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
          }`}
        >
          System Events
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="text-3xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{activity.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-600">{activity.user}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-sm text-slate-500">{activity.timestamp}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  activity.type === 'user' 
                    ? 'bg-blue-100 text-blue-700'
                    : activity.type === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

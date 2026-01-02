"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "@/app/components/LoadingSpinner";

// Admin Components
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";

// Section Components
import DashboardSection from "../components/admin/sections/DashboardSection";
import UsersSection from "../components/admin/sections/UsersSection";
import AdminsSection from "../components/admin/sections/AdminsSection";
import AnalyticsSection from "../components/admin/sections/AnalyticsSection";
import SupportSection from "../components/admin/sections/SupportSection";
import ActivitySection from "../components/admin/sections/ActivitySection";
import SettingsSection from "../components/admin/sections/SettingsSection";
import ContactsSection from "../components/admin/sections/ContactsSection";
import NotificationsSection from "../components/admin/sections/NotificationsSection";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  
  // State Management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTables: 0,
    tablesUsage: 0,
    activeUsers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    tableLimit: "10",
    staffLimit: "5",
    businessName: "",
    businessType: "restaurant",
    phone: "",
    hotelPhone: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "India" },
  });

  // Fetch Data
  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
      fetchAnalytics();
      fetchNotifications();
    }
  }, [status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [adminsRes, usersRes] = await Promise.all([
        fetch("/api/admin-users?role=admin"),
        fetch("/api/admin-users?role=user"),
      ]);

      if (!adminsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch users');
      }

      const adminsData = await adminsRes.json();
      const usersData = await usersRes.json();

      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      toast.error('Failed to load users');
      setAdmins([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/analytics');
      const data = await res.json();

      if (res.ok) {
        setAnalytics({
          ...data,
          activeUsers: users.filter(u => u.isActive !== false).length
        });
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchUsers(), fetchAnalytics(), fetchNotifications()]);
    toast.success('Data refreshed successfully');
  };

  // User Management Functions
  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tl = parseInt(form.tableLimit);
    const sl = parseInt(form.staffLimit);
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      ...(Number.isFinite(tl) ? { tableLimit: tl } : {}),
      ...(form.role === 'user' && Number.isFinite(sl) ? { staffLimit: sl } : {}),
      ...(form.role === 'user' ? {
        businessName: form.businessName,
        businessType: form.businessType,
        phone: form.phone,
        hotelPhone: form.hotelPhone,
        address: { ...form.address },
      } : {}),
    };

    const res = await fetch("/api/admin-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newUser = await res.json();
      toast.success("User created successfully");
      
      // Add new user to local state instead of full reload
      if (form.role === 'user') {
        setUsers(prevUsers => [...prevUsers, { ...newUser, tableCount: 0 }]);
        setAnalytics(prev => ({
          ...prev,
          totalUsers: prev.totalUsers + 1,
          activeUsers: prev.activeUsers + 1
        }));
      } else if (form.role === 'admin') {
        setAdmins(prevAdmins => [...prevAdmins, newUser]);
        setAnalytics(prev => ({
          ...prev,
          totalAdmins: prev.totalAdmins + 1
        }));
      }
      
      setForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        tableLimit: "10",
        staffLimit: "5",
        businessName: "",
        businessType: "restaurant",
        phone: "",
        hotelPhone: "",
        address: { street: "", city: "", state: "", zipCode: "", country: "India" },
      });
      setIsModalOpen(false);
    } else {
      const text = await res.text();
      toast.error(text);
    }
  };

  const handleEditUser = async (userId, updateData) => {
    try {
      const res = await fetch(`/api/admin-users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("User updated successfully");
        
        // Update local state instead of full reload
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, ...updateData }
              : user
          )
        );
        
        // If role changed, update admins list too
        if (updateData.role === 'admin') {
          setAdmins(prevAdmins => {
            const exists = prevAdmins.find(a => a._id === userId);
            if (!exists) {
              return [...prevAdmins, { ...data.user }];
            }
            return prevAdmins.map(a => a._id === userId ? { ...a, ...updateData } : a);
          });
        }
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin-users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully");
        
        // Update local state instead of full reload
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        setAdmins(prevAdmins => prevAdmins.filter(admin => admin._id !== userId));
        
        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          totalUsers: prev.totalUsers - 1
        }));
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await fetch(`/api/admin-users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (res.ok) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        
        // Update local state instead of full reload
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isActive: newStatus }
              : user
          )
        );
        
        // Update analytics active users count
        setAnalytics(prev => ({
          ...prev,
          activeUsers: newStatus 
            ? prev.activeUsers + 1 
            : prev.activeUsers - 1
        }));
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Notification Management Functions
  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (res.ok) {
        setNotifications(notifications.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n._id === notificationId);
          return notification && !notification.read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Loading State
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="40" />
      </div>
    );
  }

  // Auth Check
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-xl text-slate-600">Please sign in to view admin panel</p>
        </div>
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-xl text-slate-600">You do not have permission to access this page</p>
        </div>
      </div>
    );
  }

  // Render Section Content
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection analytics={analytics} users={users} admins={admins} />;
      case 'users':
        return (
          <UsersSection
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
            onAddNew={handleAddNew}
            onRefresh={fetchUsers}
          />
        );
      case 'admins':
        return (
          <AdminsSection
            admins={admins}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
            onAddNew={handleAddNew}
          />
        );
      case 'contacts':
        return <ContactsSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'support':
        return <SupportSection />;
      case 'activity':
        return <ActivitySection />;
      case 'settings':
        return <SettingsSection />;
      case 'notifications':
        return (
          <NotificationsSection 
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onDelete={deleteNotification}
            onMarkAllRead={markAllNotificationsAsRead}
          />
        );
      default:
        return <DashboardSection analytics={analytics} users={users} admins={admins} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userCount={users.length}
        adminCount={admins.length}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        unreadNotificationCount={unreadCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Header */}
        <AdminHeader
          activeSection={activeSection}
          stats={{
            totalUsers: analytics.totalUsers,
            totalAdmins: analytics.totalAdmins,
            activeUsers: analytics.activeUsers,
            totalTables: analytics.totalTables
          }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationRead={markNotificationAsRead}
          onMarkAllRead={markAllNotificationsAsRead}
        />

        {/* Content Area */}
        <main className="p-6">
          {renderSection()}
        </main>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Add New {form.role === 'admin' ? 'Admin' : 'Hotel Owner'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="user">Hotel Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {form.role === 'user' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                      <select
                        value={form.businessType}
                        onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                        <option value="bar">Bar</option>
                        <option value="hotel">Hotel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Table Limit</label>
                      <input
                        type="number"
                        value={form.tableLimit}
                        onChange={(e) => setForm({ ...form, tableLimit: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Staff Limit</label>
                      <input
                        type="number"
                        value={form.staffLimit}
                        onChange={(e) => setForm({ ...form, staffLimit: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Create {form.role === 'admin' ? 'Admin' : 'Hotel Owner'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

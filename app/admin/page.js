"use client";
import React, { useState, useEffect } from "react"; // Add React import here
import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toast notifications
import LogoutButton from "../components/Logout";
import Logo from "../components/Logo";
import PasswordInput from "../components/PasswordInput";
import LoadingSpinner from "@/app/components/LoadingSpinner"; // Import LoadingSpinner
import RefreshButton from "@/app/components/RefreshButton";
import { useSession } from "next-auth/react";



export default function AdminPanel() {
    const { data: session, status } = useSession();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", tableLimit: 10 });
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalTables: 0,
        tablesUsage: 0,
        recentActivity: []
    });
    const [editingUserId, setEditingUserId] = useState(null); // Add this line
    const [editForm, setEditForm] = useState({ name: "", email: "", role: "", password: "", tableLimit: 10, isActive: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false); 
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [adminEditForm, setAdminEditForm] = useState({ 
        name: "", 
        email: "", 
        password: "", 
        isActive: true 
    });
    const [searchQuery, setSearchQuery] = useState('');

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        setForm({ name: "", email: "", password: "", role: "user", tableLimit: 10 });
    };

    const openUsersModal = async () => {
        setIsUsersModalOpen(true);
        await fetchAllUsers();
    };

    const closeUsersModal = () => {
        setIsUsersModalOpen(false);
        setFilter('all');
    };

    const openAdminsModal = async () => {
        setIsAdminsModalOpen(true);
        await fetchUsers();
    };

    const closeAdminsModal = () => {
        setIsAdminsModalOpen(false);
    };

    const fetchAllUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const res = await fetch('/api/admin-users');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch users');

            // Process users - use tableCount, tableLimit, and assignedTables from the user object
            const usersWithTables = data.map(user => {
                const tableCount = user.tableCount || 0;
                const tableLimit = user.tableLimit || 10;

                // Get assigned table numbers if available, otherwise use empty array
                const assignedTables = Array.isArray(user.assignedTables)
                    ? user.assignedTables
                    : [];

                return {
                    ...user,
                    tableCount,
                    tableLimit,
                    assignedTables: assignedTables.filter(Boolean) // Remove any falsy values
                };
            });

            setUsers(usersWithTables);
        } catch (error) {
            console.error('Error in fetchAllUsers:', error);
            toast.error(error.message || 'Failed to load users');

            if (data) {
                setUsers(data.map(user => ({
                    ...user,
                    assignedTables: []
                })));
            }
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const filteredUsers = users.filter(user => {
        // Apply active/inactive filter
        if (filter === 'active' && user.isActive === false) return false;
        if (filter === 'inactive' && user.isActive !== false) return false;
        
        // Apply search query if it exists
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                (user.name?.toLowerCase().includes(query)) ||
                (user.email?.toLowerCase().includes(query)) ||
                (user.role?.toLowerCase().includes(query))
            );
        }
        
        return true;
    });

    useEffect(() => {
        if (session?.user?.name) {
            toast.success(`Hello ${session.user.name}, Let’s have some fun! `, {
                position: "top-right",
                autoClose: 4000,
                theme: "colored",
            });
        }
    }, [session]);

    useEffect(() => {
        fetchUsers();
        fetchAnalytics();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const [adminsRes, usersRes] = await Promise.all([
                fetch("/api/admin-users?role=admin"),
                fetch("/api/admin-users?role=user"),
            ]);

            // Check if responses are ok
            if (!adminsRes.ok) {
                const errorData = await adminsRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch admin data');
            }
            if (!usersRes.ok) {
                const errorData = await usersRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch user data');
            }

            const adminsData = await adminsRes.json();
            const usersData = await usersRes.json();

            console.log('Fetched users:', usersData); // Add this line

            // Ensure we have valid arrays
            setAdmins(Array.isArray(adminsData) ? adminsData : []);
            setUsers(Array.isArray(usersData) ? usersData : []);

        } catch (error) {
            console.error("Error fetching users:", error);
            setError(error.message || "Failed to load users data. Please try again.");
            setAdmins([]);
            setUsers([]);

            // Show error toast
            toast.error(error.message || "Failed to load users data. Please try again.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setIsRefreshing(true);
            console.log('Fetching analytics data...');
            const res = await fetch('/api/analytics');
            const data = await res.json();

            if (!res.ok) {
                console.error('Error in analytics response:', data);
                throw new Error(data.error || 'Failed to load analytics data');
            }

            console.log('Analytics data received:', data);
            setAnalytics(data);
        } catch (error) {
            console.error('Error in fetchAnalytics:', error);
            toast.error(error.message || 'Failed to load analytics data');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        await fetchAnalytics();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/admin-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const text = await res.text();

        if (res.ok) {
            toast.success("User created successfully", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setForm({ name: "", email: "", password: "", role: "user", tableLimit: 10 });
            fetchUsers();
        } else {
            toast.error("❌ " + text, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };

    const startEdit = (user) => {
        setEditingUserId(user._id);
        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive !== false,
            tableLimit: user.tableLimit || 10
        });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditForm({
            name: "",
            email: "",
            role: "user",
            isActive: true,
            tableLimit: 10
        });
    };

    const saveEdit = async () => {
        try {
            const updateData = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                tableLimit: editForm.tableLimit,
                isActive: editForm.isActive
            };

            if (editForm.password) {
                updateData.password = editForm.password;
            }

            const res = await fetch(`/api/admin-users/${editingUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                toast.success("User updated successfully", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
                setEditingUserId(null);
                fetchUsers();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update user');
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(error.message || "Failed to update user", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
    };

    const handleDelete = async (id) => {
        const res = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("User deleted successfully", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            fetchUsers();
        } else {
            toast.error("❌ Failed to delete user", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };

    const startAdminEdit = (admin) => {
        setEditingAdminId(admin._id);
        setAdminEditForm({
            name: admin.name || "",
            email: admin.email || "",
            password: "",
            isActive: admin.isActive !== false
        });
    };

    const cancelAdminEdit = () => {
        setEditingAdminId(null);
        setAdminEditForm({ name: "", email: "", password: "", isActive: true });
    };

    const saveAdminEdit = async () => {
        try {
            const updateData = {
                name: adminEditForm.name,
                email: adminEditForm.email,
                isActive: adminEditForm.isActive
            };

            if (adminEditForm.password) {
                updateData.password = adminEditForm.password;
            }

            const res = await fetch(`/api/admin-users/${editingAdminId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                toast.success("Admin updated successfully", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
                setEditingAdminId(null);
                fetchUsers();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update admin');
            }
        } catch (error) {
            console.error("Error updating admin:", error);
            toast.error(error.message || "Failed to update admin", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            console.log('Toggling status for user:', userId, 'Current status:', currentStatus);
            const newStatus = !currentStatus;
            
            // Update local state optimistically
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user._id === userId 
                        ? { ...user, isActive: newStatus } 
                        : user
                )
            );

            const res = await fetch(`/api/admin-users/${userId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    isActive: newStatus,
                    _method: 'PUT' // Ensure we're doing a PUT request
                })
            });

            const data = await res.json();
            console.log('API Response:', data);

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update user status');
            }

            toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });

            // Refresh users list to ensure we have the latest data
            fetchUsers();

        } catch (error) {
            console.error("Error toggling user status:", error);
            // Revert on error
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user._id === userId 
                        ? { ...user, isActive: currentStatus } 
                        : user
                )
            );
            toast.error(error.message || "Failed to update user status", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen py-12 px-6 sm:px-12 md:px-20 bg-amber-50 relative overflow-hidden">
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 overflow-hidden">
                    <div className="flex items-center justify-center">
                        <LoadingSpinner size="40" />
                    </div>
                </div>
            </div>
        );
    }

    if (status !== "authenticated") {
        return <div className="text-center py-8">Please sign in to view admin panel</div>;
    }

    if (session.user.role !== "admin") {
        return <div className="text-center py-8">You do not have permission to access this page</div>;
    }



    if (error) {
        return (
            <div className="min-h-screen py-12 px-6 sm:px-12 md:px-20 bg-amber-50">
                <div className="text-center text-red-600 py-8">
                    <p>{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="mt-4 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen py-12 px-6 sm:px-12 md:px-20 bg-amber-50 relative overflow-hidden"
            style={{
                backgroundImage:
                    "radial-gradient(circle at 10% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 40%)",
            }}
        >
            {/* Text Logo */}
            <header className="max-w-lg mx-auto text-center mb-10 select-none">
                <Logo className="mb-6 text-6xl" />
                <p className="mt-1 text-xl font-semibold text-amber-700 tracking-wider">Admin Panel</p>
            </header>

            {/* Add User Button */}
            <div className="flex justify-center mb-8">
                <button
                    onClick={openModal}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-colors duration-200 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Add New User
                </button>
            </div>

            {/* User Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-xl font-bold text-amber-800 mb-4">Add New User</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-600"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {form.role === 'user' && (
                                <div>
                                    <label htmlFor="tableLimit" className="block text-sm font-medium text-gray-700 mb-1">
                                        Table Limit
                                    </label>
                                    <input
                                        type="number"
                                        id="tableLimit"
                                        value={form.tableLimit}
                                        onChange={(e) => setForm({ ...form, tableLimit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            
            {/* Users Modal */}
            {isUsersModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={closeUsersModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-2xl font-bold text-amber-800 mb-6">Manage Users</h3>

                        {/* Modal Header with Filters and Search */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <h2 className="text-xl font-semibold text-gray-800">Users List</h2>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                    <div className="flex-1 md:flex-none">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-0.5 bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                                filter === 'all' 
                                                    ? 'bg-white text-amber-600 shadow-sm ring-1 ring-amber-200' 
                                                    : 'text-gray-600 hover:bg-white hover:text-amber-600'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-1.5">
                                                <span>All</span>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                                    {users.length}
                                                </span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setFilter('active')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                                filter === 'active' 
                                                    ? 'bg-white text-green-600 shadow-sm ring-1 ring-green-200' 
                                                    : 'text-gray-600 hover:bg-white hover:text-green-600'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-1.5">
                                                <span>Active</span>
                                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                                    {users.filter(u => u.isActive !== false).length}
                                                </span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setFilter('inactive')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                                filter === 'inactive' 
                                                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-red-200' 
                                                    : 'text-gray-600 hover:bg-white hover:text-red-600'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-1.5">
                                                <span>Inactive</span>
                                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                                    {users.filter(u => u.isActive === false).length}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="space-y-4">
                            {isLoadingUsers ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.map((user) => (
                                                <React.Fragment key={user._id}>
                                                    <tr className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                                    <span className="text-amber-800 font-medium">
                                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                                    <div className="text-xs text-gray-400">
                                                                        Tables: {user.tableCount || 0}/{user.tableLimit || 10}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    user.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {user.isActive === false ? 'Inactive' : 'Active'}
                                                                </span>
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="sr-only peer"
                                                                        checked={user.isActive !== false}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleUserStatus(user._id, user.isActive !== false);
                                                                        }}
                                                                    />
                                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={() => startEdit(user)}
                                                                className="text-xs font-medium px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                                                        handleDelete(user._id);
                                                                    }
                                                                }}
                                                                className="text-xs font-medium px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Render the edit form if this user is being edited */}
                                                    {editingUserId === user._id && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4">
                                                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                                                <h4 className="font-medium text-gray-700 mb-3">Edit User</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Name
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.name}
                                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Email
                                                                        </label>
                                                                        <input
                                                                            type="email"
                                                                            value={editForm.email}
                                                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            New Password (leave blank to keep current)
                                                                        </label>
                                                                        <input
                                                                            type="password"
                                                                            value={editForm.password}
                                                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <div className="flex items-center h-5">
                                                                            <input
                                                                                id={`active-${user._id}`}
                                                                                name={`active-${user._id}`}
                                                                                type="checkbox"
                                                                                checked={editForm.isActive !== false}
                                                                                onChange={(e) => 
                                                                                    setEditForm({ ...editForm, isActive: e.target.checked })
                                                                                }
                                                                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                                            />
                                                                        </div>
                                                                        <label htmlFor={`active-${user._id}`} className="ml-2 block text-sm text-gray-700">
                                                                            Active
                                                                        </label>
                                                                    </div>
                                                                    {editForm.role === 'user' && (
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                Table Limit
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                value={editForm.tableLimit || 10}
                                                                                onChange={(e) => setEditForm({...editForm, tableLimit: parseInt(e.target.value)})}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-end space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelEdit}
                                                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={saveEdit}
                                                                        className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                                                    >
                                                                        Save Changes
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No users found matching your criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Admins Modal */}
            {isAdminsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={closeAdminsModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-2xl font-bold text-amber-800 mb-6">Admin Users</h3>

                        {/* Admins List */}
                        <div className="space-y-4">
                            {isLoadingUsers ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                                </div>
                            ) : admins.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Admin
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {admins.map((admin) => (
                                                <React.Fragment key={admin._id}>
                                                    <tr className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <span className="text-blue-800 font-medium">
                                                                        {admin.name?.charAt(0).toUpperCase() || 'A'}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {admin.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                admin.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {admin.isActive === false ? 'Inactive' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={() => startAdminEdit(admin)}
                                                                className="text-xs font-medium px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            >
                                                                Edit
                                                            </button>
                                                            {admins.length > 1 && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to delete this admin?')) {
                                                                            handleDelete(admin._id);
                                                                        }
                                                                    }}
                                                                    className="text-xs font-medium px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Edit Form */}
                                                    {editingAdminId === admin._id && (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-4">
                                                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                                                    <h4 className="font-medium text-gray-700 mb-3">Edit Admin</h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                Name
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={adminEditForm.name}
                                                                                onChange={(e) => 
                                                                                    setAdminEditForm({ ...adminEditForm, name: e.target.value })
                                                                                }
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                Email
                                                                            </label>
                                                                            <input
                                                                                type="email"
                                                                                value={adminEditForm.email}
                                                                                onChange={(e) => 
                                                                                    setAdminEditForm({ ...adminEditForm, email: e.target.value })
                                                                                }
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                New Password (leave blank to keep current)
                                                                            </label>
                                                                            <input
                                                                                type="password"
                                                                                value={adminEditForm.password}
                                                                                onChange={(e) => 
                                                                                    setAdminEditForm({ ...adminEditForm, password: e.target.value })
                                                                                }
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <div className="flex items-center h-5">
                                                                                <input
                                                                                    id={`active-${admin._id}`}
                                                                                    name={`active-${admin._id}`}
                                                                                    type="checkbox"
                                                                                    checked={adminEditForm.isActive}
                                                                                    onChange={(e) => 
                                                                                        setAdminEditForm({ ...adminEditForm, isActive: e.target.checked })
                                                                                    }
                                                                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                                                />
                                                                            </div>
                                                                            <label htmlFor={`active-${admin._id}`} className="ml-2 block text-sm text-gray-700">
                                                                                Active
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-end space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelAdminEdit}
                                                                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={saveAdminEdit}
                                                                            className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                                                        >
                                                                            Save Changes
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No admin users found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Toast Container */}
            <ToastContainer />

            {/* Analytics Section */}
            <section className="max-w-6xl mx-auto mb-12">
                <div className="flex justify-between items-center mb-6 p-2">
                    <LogoutButton className="ml-2" />
                    <h2 className="text-3xl font-bold text-amber-700 tracking-wide">Analytics Dashboard</h2>
                    <RefreshButton
                        onRefresh={handleRefresh}
                        label="Refresh Analytics"
                        className2="text-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users Card */}
                    <div
                        onClick={openUsersModal}
                        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 hover:border-amber-200"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <p className="text-3xl font-bold text-amber-600">{analytics.totalUsers}</p>
                            </div>
                            <div className="p-3 rounded-full bg-amber-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                            <span className="flex items-center text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {analytics.totalUsers} total
                            </span>
                        </div>
                    </div>

                    {/* Total Admins Card */}
                    <div 
                        onClick={openAdminsModal}
                        className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-amber-200 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Admins</h3>
                                <p className="text-2xl font-bold text-blue-800">{analytics.totalAdmins || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                            <span className="flex items-center text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {analytics.totalAdmins} total
                            </span>
                        </div>
                    </div>

                    {/* Total Tables Allowed Card */}
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-amber-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Tables Allowed</h3>
                                <p className="text-2xl font-bold text-green-800">{analytics.totalTablesAllowed || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Tables Created Card */}
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-amber-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Tables Created</h3>
                                <p className="text-2xl font-bold text-purple-800">{analytics.totalTablesCreated || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tables Usage Card */}
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-amber-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>

                            </div>
                            <div className="ml-4">
                                <h3 className="text-gray-500 text-sm font-medium">Tables Usage</h3>
                                <p className="text-2xl font-bold text-indigo-800">{analytics.tablesUsage || 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-amber-200">
                    <h3 className="text-xl font-semibold mb-4 text-amber-800">Recent Activity</h3>
                    {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
                        <ul className="divide-y divide-amber-100">
                            {analytics.recentActivity.map((activity, index) => (
                                <li key={index} className="py-3 flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-amber-500 italic">No recent activity</p>
                    )}
                </div>
            </section>

            {/* Admins Section */}
            {/* <section className="max-w-4xl mx-auto mb-12">
                <h2 className="text-3xl font-bold mb-6 text-amber-700 tracking-wide">Admins</h2>
                {admins.length === 0 ? (
                    <p className="text-center text-amber-500 italic">No admins found.</p>
                ) : (
                    <ul className="space-y-8">
                        {admins.map((admin) => (
                            <li
                                key={admin._id}
                                className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-3xl p-7 border border-amber-300"
                            >
                                {editingAdminId === admin._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={adminEditForm.name}
                                            onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        />
                                        <input
                                            type="email"
                                            value={adminEditForm.email}
                                            onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        />
                                        <select
                                            value={adminEditForm.role}
                                            onChange={(e) => setAdminEditForm({ ...adminEditForm, role: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        >
                                            <option value="admin" className="text-amber-900">Admin</option>
                                            <option value="user" className="text-amber-900">User </option>
                                        </select>

                                        <PasswordInput
                                            value={adminEditForm.password}
                                            onChange={(e) => setAdminEditForm({ ...adminEditForm, password: e.target.value })}
                                            placeholder="New password (leave blank to keep current)"
                                            className="mb-5"
                                        />

                                        <div className="flex items-center">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id={`active-${admin._id}`}
                                                    name={`active-${admin._id}`}
                                                    type="checkbox"
                                                    checked={adminEditForm.isActive}
                                                    onChange={(e) => setAdminEditForm({ ...adminEditForm, isActive: e.target.checked })}
                                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                />
                                            </div>
                                            <label htmlFor={`active-${admin._id}`} className="ml-2 block text-sm text-gray-700">
                                                Active
                                            </label>
                                        </div>

                                        <div className="flex space-x-5">
                                            <button
                                                onClick={saveAdminEdit}
                                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelAdminEdit}
                                                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-2xl mb-2 text-amber-900 font-semibold">{admin.name}</p>
                                        <p className="mb-2 text-amber-900 font-semibold">Email: <span className="font-normal">{admin.email}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Role: <span className="font-normal">{admin.role}</span></p>
                                        <div className="flex space-x-6 mt-5">
                                            <button
                                                onClick={() => startAdminEdit(admin)}
                                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin._id)}
                                                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section> */}

            {/* Users Section */}
            {/* <section className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-amber-700 tracking-wide">Users</h2>
                {users.length === 0 ? (
                    <p className="text-center text-amber-500 italic">No users found.</p>
                ) : (
                    <ul className="space-y-8">
                        {users.map((user) => (
                            <li
                                key={user._id}
                                className="bg-white bg-opacity-95 backdrop-blur-sm shadow-xl rounded-3xl p-7 border border-amber-300"
                            >
                                {editingUserId === user._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        />
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        />
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="mb-4 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
                                        >
                                            <option value="user" className="text-amber-900">User </option>
                                            <option value="admin" className="text-amber-900">Admin</option>
                                        </select>

                                        <PasswordInput
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                            placeholder="New password (leave blank to keep current)"
                                            className="mb-5"
                                        />

                                        {editForm.role === 'user' && (
                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tableLimit">
                                                    Table Limit
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    id="tableLimit"
                                                    value={editForm.tableLimit}
                                                    onChange={(e) => setEditForm({...editForm, tableLimit: e.target.value})}
                                                />
                                            </div>
                                        )}
                                        <div className="flex space-x-5">
                                            <button
                                                onClick={saveEdit}
                                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-semibold text-amber-900">{user.name}</h3>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                                                    Tables: {user.tableCount || 0}/{user.tableLimit || 10}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mb-2 text-amber-900 font-semibold">Email: <span className="font-normal">{user.email}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Role: <span className="font-normal">{user.role}</span></p>
                                        
                                        <div className="flex space-x-6 mt-5">
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section> */}
        </div>
    );
}

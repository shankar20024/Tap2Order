"use client";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toast notifications
import LogoutButton from "../components/Logout";
import Logo from "../components/Logo";
import PasswordInput from "../components/PasswordInput";
import LoadingSpinner from "@/app/components/LoadingSpinner"; // Import LoadingSpinner
import { useSession } from "next-auth/react";

export default function AdminPanel() {
    const { data: session, status } = useSession();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [editingUserId, seteditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", role: "", password: "", tableLimit: 10 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [adminsRes, usersRes] = await Promise.all([
                fetch("/api/admin-users?role=admin"),
                fetch("/api/admin-users?role=user"),
            ]);

            if (!adminsRes.ok || !usersRes.ok) {
                throw new Error("Failed to fetch users data");
            }

            const adminsData = await adminsRes.json();
            const usersData = await usersRes.json();
            
            setAdmins(adminsData);
            setUsers(usersData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Failed to load users data. Please try again.");
            setAdmins([]);
            setUsers([]);
            setLoading(false);
        }
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
            setForm({ name: "", email: "", password: "", role: "user" });
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
        seteditingUserId(user._id);
        setEditForm({ 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            password: "",
            tableLimit: user.tableLimit || 10
        });
    };

    const cancelEdit = () => {
        seteditingUserId(null);
        setEditForm({ name: "", email: "", role: "", password: "", tableLimit: 10 });
    };

    const saveEdit = async () => {
        const updateData = {
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            tableLimit: parseInt(editForm.tableLimit) || 10
        };

        if (editForm.password && editForm.password.trim().length >= 6) {
            updateData.password = editForm.password;
        } else if (editForm.password && editForm.password.trim().length > 0 && editForm.password.trim().length < 6) {
            toast.error("❌ Password must be at least 6 characters", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            return;
        }

        const res = await fetch(`/api/admin-users/${editingUserId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
        });

        if (res.ok) {
            toast.success(" User updated successfully", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            seteditingUserId(null);
            setEditForm({ name: "", email: "", role: "", password: "", tableLimit: 10 });
            fetchUsers();
        } else {
            toast.error("❌ Failed to update user", {
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

    if (loading) {
        return <LoadingSpinner size="40" />;
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
                    "radial-gradient(circle at 10% 20%, rgba(250, 204, 21, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.15) 0%, transparent 40%)",
            }}
        >
            {/* Text Logo */}
            <header className="max-w-lg mx-auto text-center mb-10 select-none">
                <Logo className="mb-6 text-6xl" />
                <p className="mt-1 text-xl font-semibold text-amber-700 tracking-wider">Admin Panel</p>
            </header>

            {/* User Creation Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-xl p-10 max-w-lg mx-auto mb-12"
            >
                <h2 className="text-2xl font-semibold mb-6 text-amber-800 tracking-wide">Create New User</h2>

                <input
                    type="text"
                    placeholder="Name"
                    required
                    className="mb-5 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-amber-900 transition"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                    type="email"
                    placeholder="Email"
                    required
                    className="mb-5 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-amber-900 transition"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <PasswordInput
                    placeholder="Password"
                    required
                    className="mb-5 "
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <select
                    className="mb-8 w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-amber-900 transition"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                    <option value="user" className="text-amber-900">User </option>
                    <option value="admin" className="text-amber-900">Admin</option>
                </select>
                {form.role === 'user' && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tableLimit">
                            Table Limit
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="tableLimit"
                            value={form.tableLimit}
                            onChange={(e) => setForm({...form, tableLimit: e.target.value})}
                        />
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-amber-600 transition"
                >
                    Create User
                </button>
                <div className="mt-6 flex justify-center">
                    <LogoutButton />
                </div>
            </form>

            {/* Toast Container */}
            <ToastContainer />

            {/* Admins Section */}
            <section className="max-w-4xl mx-auto mb-12">
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
                                {editingUserId === admin._id ? (
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
                                            <option value="admin" className="text-amber-900">Admin</option>
                                            <option value="user" className="text-amber-900">User </option>
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
                                        <p className="mb-2 text-amber-900 font-semibold">Name: <span className="font-normal">{admin.name}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Email: <span className="font-normal">{admin.email}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Role: <span className="font-normal">{admin.role}</span></p>
                                        <div className="flex space-x-6 mt-5">
                                            <button
                                                onClick={() => startEdit(admin)}
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
            </section>

            {/* Users Section */}
            <section className="max-w-4xl mx-auto">
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
                                        <p className="mb-2 text-amber-900 font-semibold">Name: <span className="font-normal">{user.name}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Email: <span className="font-normal">{user.email}</span></p>
                                        <p className="mb-2 text-amber-900 font-semibold">Role: <span className="font-normal">{user.role}</span></p>
                                        {user.role === 'user' && (
                                            <div className="text-sm text-gray-600">
                                                <p>Tables: {user.tables?.length || 0}/{user.tableLimit || 10}</p>
                                            </div>
                                        )}
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
            </section>
        </div>
    );
}

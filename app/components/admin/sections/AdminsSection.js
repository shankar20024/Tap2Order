"use client";
import React, { useState } from 'react';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaUserShield, FaPlus } from 'react-icons/fa';

export default function AdminsSection({ admins, onEdit, onDelete, onToggleStatus, onAddNew }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', isActive: true });

  const startEdit = (admin) => {
    setEditingId(admin._id);
    setEditForm({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      isActive: admin.isActive !== false
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', email: '', password: '', isActive: true });
  };

  const saveEdit = async () => {
    await onEdit(editingId, {
      name: editForm.name,
      email: editForm.email,
      isActive: editForm.isActive,
      role: 'admin',
      ...(editForm.password ? { password: editForm.password } : {})
    });
    cancelEdit();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Users</h2>
          <p className="text-slate-600 mt-1">Manage system administrators</p>
        </div>
        <button
          onClick={onAddNew}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <FaPlus />
          Add Admin
        </button>
      </div>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins && admins.length > 0 ? (
          admins.map((admin) => (
            <div
              key={admin._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {editingId === admin._id ? (
                // Edit Mode
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password (optional)</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label className="text-sm text-slate-700">Active</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <FaUserShield className="text-3xl" />
                      </div>
                      <button
                        onClick={() => onToggleStatus(admin._id, admin.isActive)}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                      >
                        {admin.isActive !== false ? (
                          <FaToggleOn className="text-2xl" />
                        ) : (
                          <FaToggleOff className="text-2xl opacity-60" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{admin.name}</h3>
                    <p className="text-purple-100 text-sm">{admin.email}</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.isActive !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-slate-500">Admin Role</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(admin)}
                        className="flex-1 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEdit />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
                            onDelete(admin._id);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">
            <FaUserShield className="text-6xl mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No admin users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

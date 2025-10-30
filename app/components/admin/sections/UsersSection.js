"use client";
import React, { useState } from 'react';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSearch, FaPlus, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function UsersSection({ users, onEdit, onDelete, onToggleStatus, onAddNew, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    businessName: '',
    businessType: 'restaurant',
    phone: '',
    hotelPhone: '',
    tableLimit: '10',
    staffLimit: '5',
    isActive: true,
    password: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'India' }
  });

  const filteredUsers = users?.filter(user => {
    // Apply active/inactive filter
    if (filter === 'active' && user.isActive === false) return false;
    if (filter === 'inactive' && user.isActive !== false) return false;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.businessName?.toLowerCase().includes(query) ||
        user.hotelCode?.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
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
            All ({users?.length || 0})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
            }`}
          >
            Active ({users?.filter(u => u.isActive !== false).length || 0})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'inactive'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
            }`}
          >
            Inactive ({users?.filter(u => u.isActive === false).length || 0})
          </button>
        </div>

        {/* Add New Button */}
        <button
          onClick={onAddNew}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <FaPlus />
          Add Hotel Owner
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hotel Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tables</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                        {user.hotelCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{user.businessName || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{user.businessType || 'restaurant'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">
                        {user.tableCount || 0} / {user.tableLimit || 10}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleStatus(user._id, user.isActive)}
                        className="flex items-center gap-2"
                      >
                        {user.isActive !== false ? (
                          <>
                            <FaToggleOn className="text-2xl text-green-500" />
                            <span className="text-sm font-medium text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <FaToggleOff className="text-2xl text-red-400" />
                            <span className="text-sm font-medium text-red-600">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditForm({
                              name: user.name || '',
                              email: user.email || '',
                              businessName: user.businessName || '',
                              businessType: user.businessType || 'restaurant',
                              phone: user.phone || '',
                              hotelPhone: user.hotelPhone || '',
                              tableLimit: String(user.tableLimit || 10),
                              staffLimit: String(user.staffLimit || 5),
                              isActive: user.isActive !== false,
                              password: '',
                              address: user.address || { street: '', city: '', state: '', zipCode: '', country: 'India' }
                            });
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                              onDelete(user._id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No hotel owners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Edit Hotel Owner</h3>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditForm({
                      name: '',
                      email: '',
                      businessName: '',
                      businessType: 'restaurant',
                      phone: '',
                      hotelPhone: '',
                      tableLimit: '10',
                      staffLimit: '5',
                      isActive: true,
                      password: '',
                      address: { street: '', city: '', state: '', zipCode: '', country: 'India' }
                    });
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                  <select
                    value={editForm.businessType}
                    onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="bar">Bar</option>
                    <option value="hotel">Hotel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Phone</label>
                  <input
                    type="text"
                    value={editForm.hotelPhone}
                    onChange={(e) => setEditForm({ ...editForm, hotelPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Table Limit</label>
                  <input
                    type="number"
                    value={editForm.tableLimit}
                    onChange={(e) => setEditForm({ ...editForm, tableLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Limit</label>
                  <input
                    type="number"
                    value={editForm.staffLimit}
                    onChange={(e) => setEditForm({ ...editForm, staffLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Enter new password or leave blank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Active Account</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    await onEdit(editingUser._id, {
                      name: editForm.name,
                      email: editForm.email,
                      businessName: editForm.businessName,
                      businessType: editForm.businessType,
                      phone: editForm.phone,
                      hotelPhone: editForm.hotelPhone,
                      tableLimit: parseInt(editForm.tableLimit),
                      staffLimit: parseInt(editForm.staffLimit),
                      isActive: editForm.isActive,
                      ...(editForm.password ? { password: editForm.password } : {}),
                      address: editForm.address
                    });
                    setEditingUser(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Hotel Owner Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Hotel Code</p>
                  <p className="font-semibold text-slate-800">{selectedUser.hotelCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Owner Name</p>
                  <p className="font-semibold text-slate-800">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Business Name</p>
                  <p className="font-semibold text-slate-800">{selectedUser.businessName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Business Type</p>
                  <p className="font-semibold text-slate-800">{selectedUser.businessType || 'restaurant'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-semibold text-slate-800">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="font-semibold text-slate-800">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Table Limit</p>
                  <p className="font-semibold text-slate-800">{selectedUser.tableLimit || 10}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Staff Limit</p>
                  <p className="font-semibold text-slate-800">{selectedUser.staffLimit || 5}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Address</p>
                  <p className="font-semibold text-slate-800">
                    {selectedUser.address?.street}, {selectedUser.address?.city}, {selectedUser.address?.state} - {selectedUser.address?.zipCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

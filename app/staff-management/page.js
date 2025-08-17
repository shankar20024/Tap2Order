"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaUsers, 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope, 
  FaCalendar, 
  FaKey, 
  FaUserPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaChartLine,
  FaEye,
  FaSave,
  FaTimes,
  FaCopy
} from "react-icons/fa";
import { AiOutlineLoading3Quarters, AiOutlineSync } from "react-icons/ai";
import { useSession, signOut } from "next-auth/react";
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";

export default function StaffManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    department: "all",
    position: "all",
    page: 1,
    limit: 10
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [editingPasscodeId, setEditingPasscodeId] = useState(null);
  const [editingPasscodeValue, setEditingPasscodeValue] = useState("");
  const [passcodeSaving, setPasscodeSaving] = useState(false);

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('Copied');
    } catch (e) {
      alert('Copy failed');
    }
  };

  // Auth guard and initial fetch
  useEffect(() => {
    if (status === "loading") return; // wait
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    // authenticated
    fetchStaff();
  }, [status, filters]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/staff?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
        },
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStaff(data.staff);
        setStats(data.stats);
      } else {
        console.error("Failed to fetch staff:", data.error);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (formData) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNewPasscode(data.generatedPasscode);
        fetchStaff();
        setShowCreateModal(false);
        alert(`Staff created successfully! Passcode: ${data.generatedPasscode}`);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasscode = async (staffId) => {
    if (!confirm("Are you sure you want to reset this staff member's passcode?")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "reset_passcode" })
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert(`Passcode reset successfully! New passcode: ${data.newPasscode}`);
        fetchStaff();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          confirmDelete: true,
          deactivateOnly: false 
        })
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        fetchStaff();
        alert("Staff member deleted successfully");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (staffMember) => {
    if (!staffMember.isActive) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Active</span>;
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const startEditPasscode = (id, current) => {
    setEditingPasscodeId(id);
    setEditingPasscodeValue(current || "");
  };

  const cancelEditPasscode = () => {
    setEditingPasscodeId(null);
    setEditingPasscodeValue("");
  };

  const savePasscode = async (id) => {
    const value = String(editingPasscodeValue || "").trim();
    if (!/^\d{4}$/.test(value)) {
      alert("Passcode must be exactly 4 digits");
      return;
    }
    try {
      setPasscodeSaving(true);
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: value })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || `Failed (${res.status})`);
      setStaff((prev) => prev.map((s) => (s._id === id ? { ...s, passcode: value } : s)));
      cancelEditPasscode();
    } catch (e) {
      alert(e.message || "Failed to update passcode");
    } finally {
      setPasscodeSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:overflow-hidden">
      <Header />
      <Sidebar />
      <div className="pt-20 md:pt-0 md:fixed md:top-16 md:left-64 md:right-0 md:bottom-0 md:overflow-hidden">
        <div className="md:flex md:flex-col md:h-full">
          {/* Header (fixed height within pane) */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <FaChartLine className="w-8 h-8 text-orange-500 mr-3" />
                  <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
                </div>
              </div>
            </div>
          </header>

          {/* Content area fills remaining space and scrolls internally */}
          <div className="md:flex-1 md:overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-6 md:h-full">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FaUsers className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FaCheckCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FaExclamationCircle className="w-8 h-8 text-yellow-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available Slots</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.available || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FaKey className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Staff Limit</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.limit || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <FaSearch className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    {/* Department Filter */}
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value, page: 1 }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="all">All Departments</option>
                      <option value="service">Service</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="management">Management</option>
                      <option value="cleaning">Cleaning</option>
                    </select>
                  </div>
                  
                  {/* Create Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchStaff()}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Refresh"
                    >
                      <AiOutlineSync className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      disabled={stats.available === 0}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus className="w-5 h-5 mr-2" />
                      Add Staff Member
                    </button>
                  </div>
                </div>
              </div>

              {/* Staff Table - scrollable on desktop, natural on mobile */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden md:flex-1">
                <div className="overflow-x-auto md:overflow-y-auto md:h-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Passcode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                            <p className="mt-2 text-gray-500">Loading staff...</p>
                          </td>
                        </tr>
                      ) : staff.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            No staff members found
                          </td>
                        </tr>
                      ) : (
                        staff.map((member) => (
                          <tr key={member._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">ID: {member.employeeId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingPasscodeId === member._id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\\d{4}"
                                    maxLength={4}
                                    className="w-20 px-2 py-1 border rounded font-mono"
                                    value={editingPasscodeValue}
                                    onChange={(e) => setEditingPasscodeValue(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                                  />
                                  <button
                                    onClick={() => savePasscode(member._id)}
                                    disabled={passcodeSaving}
                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                    title="Save"
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    onClick={cancelEditPasscode}
                                    disabled={passcodeSaving}
                                    className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                    title="Cancel"
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono text-gray-900">{member.passcode || "—"}</span>
                                  {member.passcode && (
                                    <button
                                      onClick={() => copyText(member.passcode)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Copy"
                                    >
                                      <FaCopy />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => startEditPasscode(member._id, member.passcode)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Passcode"
                                  >
                                    <FaEdit />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 capitalize">{member.position}</div>
                                <div className="text-sm text-gray-500 capitalize">{member.department}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                {member.email && (
                                  <div className="text-sm text-gray-900 flex items-center">
                                    <FaEnvelope className="w-4 h-4 mr-1" />
                                    {member.email}
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <FaPhone className="w-4 h-4 mr-1" />
                                    {member.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(member)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <FaCalendar className="w-4 h-4 mr-1" />
                                {new Date(member.dateOfJoining).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => router.push(`/staff-management/${member._id}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <FaEye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResetPasscode(member._id)}
                                  disabled={actionLoading}
                                  className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                  title="Reset Passcode"
                                >
                                  <FaKey className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/staff-management/${member._id}/edit`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Edit"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(member._id)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStaff}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Create Staff Modal Component
function CreateStaffModal({ onClose, onCreate, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "waiter",
    department: "service",
    salary: "",
    permissions: ["view_orders", "update_order_status", "take_orders", "view_menu", "view_tables"],
    shiftTiming: { start: "09:00", end: "18:00" },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Add New Staff Member</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <select
                required
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="cleaner">Cleaner</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="service">Service</option>
                <option value="kitchen">Kitchen</option>
                <option value="management">Management</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FaUserPlus className="w-4 h-4 mr-2" />
              )}
              Create Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function CustomerSupportPage() {
    const { data: session, status } = useSession();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        urgentTickets: 0,
        highPriorityTickets: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        issueType: 'all'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalTickets: 0,
        limit: 20
    });

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "admin") {
            fetchTickets();
        }
    }, [status, session, filters, pagination.currentPage]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                status: filters.status,
                priority: filters.priority,
                issueType: filters.issueType,
                page: pagination.currentPage.toString(),
                limit: pagination.limit.toString()
            });

            const response = await fetch(`/api/customer-support?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch tickets');
            }

            setTickets(data.tickets);
            setStats(data.stats);
            setPagination(data.pagination);
        } catch (error) {
            toast.error(error.message || 'Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    };

    const updateTicket = async (ticketId, updateData) => {
        try {
            const response = await fetch(`/api/customer-support/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update ticket');
            }

            toast.success('Ticket updated successfully');
            fetchTickets();
            setIsModalOpen(false);
            setSelectedTicket(null);
        } catch (error) {
            toast.error(error.message || 'Failed to update ticket');
        }
    };

    const deleteTicket = async (ticketId) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;

        try {
            const response = await fetch(`/api/customer-support/${ticketId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete ticket');
            }

            toast.success('Ticket deleted successfully');
            fetchTickets();
        } catch (error) {
            toast.error(error.message || 'Failed to delete ticket');
        }
    };

    const openTicketModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            open: 'bg-red-100 text-red-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority) => {
        const priorityColors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return priorityColors[priority] || 'bg-gray-100 text-gray-800';
    };

    const filteredTickets = tickets.filter(ticket => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.customerName?.toLowerCase().includes(query) ||
                ticket.customerEmail?.toLowerCase().includes(query) ||
                ticket.subject?.toLowerCase().includes(query) ||
                ticket.hotelName?.toLowerCase().includes(query) ||
                ticket.hotelCode?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="40" />
            </div>
        );
    }

    if (status !== "authenticated" || session?.user?.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
                            <p className="mt-2 text-gray-600">Manage customer support tickets and resolve issues</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/admin'}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Admin
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalTickets}</div>
                        <div className="text-sm text-gray-600">Total Tickets</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-red-600">{stats.openTickets}</div>
                        <div className="text-sm text-gray-600">Open</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</div>
                        <div className="text-sm text-gray-600">Resolved</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-red-700">{stats.urgentTickets}</div>
                        <div className="text-sm text-gray-600">Urgent</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-orange-600">{stats.highPriorityTickets}</div>
                        <div className="text-sm text-gray-600">High Priority</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                            <select
                                value={filters.issueType}
                                onChange={(e) => setFilters({...filters, issueType: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="technical">Technical</option>
                                <option value="billing">Billing</option>
                                <option value="service">Service</option>
                                <option value="feature_request">Feature Request</option>
                                <option value="complaint">Complaint</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="40" />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hotel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTickets.map((ticket) => (
                                        <tr key={ticket._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                                                    <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{ticket.hotelName}</div>
                                                    <div className="text-sm text-gray-500">{ticket.hotelCode}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                                                <div className="text-sm text-gray-500 capitalize">{ticket.issueType.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => openTicketModal(ticket)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => deleteTicket(ticket._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredTickets.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-500">No tickets found matching your criteria.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-700">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {isModalOpen && selectedTicket && (
                <TicketModal
                    ticket={selectedTicket}
                    onClose={closeModal}
                    onUpdate={updateTicket}
                />
            )}

            <ToastContainer />
        </div>
    );
}

// Ticket Detail Modal Component
function TicketModal({ ticket, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo || '',
        resolution: ticket.resolution || '',
        internalNote: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(ticket._id, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Support Ticket Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Ticket Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Ticket Information</h3>
                            
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                                    <p className="text-sm text-gray-900">{ticket.customerName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-sm text-gray-900">{ticket.customerEmail}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <p className="text-sm text-gray-900">{ticket.customerPhone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hotel</label>
                                    <p className="text-sm text-gray-900">{ticket.hotelName} ({ticket.hotelCode})</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Issue Type</label>
                                    <p className="text-sm text-gray-900 capitalize">{ticket.issueType.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                                    <p className="text-sm text-gray-900">{ticket.subject}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                                </div>
                                {ticket.orderNumber && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Order Number</label>
                                        <p className="text-sm text-gray-900">{ticket.orderNumber}</p>
                                    </div>
                                )}
                                {ticket.tableNumber && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Table Number</label>
                                        <p className="text-sm text-gray-900">{ticket.tableNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                                    <p className="text-sm text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Update Form */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Update Ticket</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                                    <input
                                        type="text"
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                                        placeholder="Enter assignee name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                                    <textarea
                                        value={formData.resolution}
                                        onChange={(e) => setFormData({...formData, resolution: e.target.value})}
                                        placeholder="Enter resolution details"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Internal Note</label>
                                    <textarea
                                        value={formData.internalNote}
                                        onChange={(e) => setFormData({...formData, internalNote: e.target.value})}
                                        placeholder="Add internal note (optional)"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                                    >
                                        Update Ticket
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>

                            {/* Internal Notes History */}
                            {ticket.internalNotes && ticket.internalNotes.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Internal Notes</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {ticket.internalNotes.map((note, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-sm text-gray-900">{note.note}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    By {note.addedBy} on {new Date(note.addedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

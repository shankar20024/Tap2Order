// Updated ContactsSection component with a professional DataTable layout (Pure JavaScript Version)
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Maps contact status to Tailwind badge styles
const statusStyles = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  spam: 'bg-red-100 text-red-800',
};

export default function ContactsSection() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContacts();
  }, [statusFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' ? '/api/contacts' : `/api/contacts?status=${statusFilter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data)) {
          setContacts(data);
        } else {
          console.error('Contacts API did not return an array:', data);
          setContacts([]);
        }
      } else {
        console.error('Failed to fetch contacts:', data?.error || data);
        setContacts([]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchContacts();
        if (selectedContact && selectedContact._id === id) {
          setSelectedContact({ ...selectedContact, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) fetchContacts();
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const getStatusClass = (status) => {
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Contacts</h2>
          <p className="text-sm text-gray-500">Manage and respond to customer inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="spam">Spam</option>
          </select>
          <button
            onClick={fetchContacts}
            className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No contacts found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr
                  key={contact._id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${!contact.read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelectedContact(contact);
                    if (!contact.read) markAsRead(contact._id);
                  }}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{contact.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contact.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contact.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[200px]">
                    {contact.message?.substring(0, 50)}{contact.message && contact.message.length > 50 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(contact.status)}`}>
                      {(contact.status || 'unknown').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedContact.name}</h3>
                <p className="text-sm text-gray-600">{selectedContact.email}</p>
                {selectedContact.phone && <p className="text-sm text-gray-600">Phone: {selectedContact.phone}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {selectedContact.createdAt ? format(new Date(selectedContact.createdAt), 'EEE, MMM d yyyy h:mm a') : ''}
                </p>
                <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedContact.status)}`}>
                  {(selectedContact.status || 'unknown').replace('_', ' ')}
                </span>
              </div>

              <button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <p className="whitespace-pre-line text-gray-700">{selectedContact.message}</p>

              {selectedContact.metadata && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Metadata</h4>
                  <p className="text-sm text-gray-500">IP: {selectedContact.metadata.ipAddress}</p>
                  <p className="text-sm text-gray-500 truncate">User Agent: {selectedContact.metadata.userAgent}</p>
                  {selectedContact.metadata.referrer && <p className="text-sm text-gray-500">Referrer: {selectedContact.metadata.referrer}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <select
                value={selectedContact.status}
                onChange={(e) => updateStatus(selectedContact._id, e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
              </select>

              <a href={`mailto:${selectedContact.email}`} className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700">
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

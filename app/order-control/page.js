'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ably from '@/lib/ably';
import { toast } from 'react-hot-toast';
import { FiSearch, FiTrash2, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Header from '../components/Header';

export default function OrderControlPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const tenantUserId = useMemo(() => {
    const base = session?.user?.id;
    const isStaff = session?.user?.role === 'staff';
    const normalize = (val) => {
      if (!val) return undefined;
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val.$oid) return String(val.$oid);
      try { return String(val); } catch { return undefined; }
    };

    if (isStaff) {
      const fromSession = normalize(session?.user?.hotelOwner);
      if (fromSession) return fromSession;
      if (typeof window === 'undefined') return undefined;
      const fromStorage = normalize(localStorage.getItem('selectedHotelUserId'));
      return fromStorage || undefined;
    }
    return normalize(base);
  }, [session?.user?.id, session?.user?.role, session?.user?.hotelOwner]);

  // Redirect unauthenticated without JWT
  useEffect(() => {
    if (status === 'unauthenticated') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) router.push('/login');
    }
  }, [status, router]);

  const [last4, setLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchOrders();
    }
  };

  const refreshResults = () => {
    if (last4 && /^[0-9a-fA-F]{4}$/.test(last4.trim())) {
      searchOrders();
    } else {
      toast('Enter last 4 and press Search');
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      preparing: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      served: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      completed: 'bg-gray-100 text-gray-700 border-gray-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`;
  };

  const searchOrders = async () => {
    if (!tenantUserId) {
      toast.error('Hotel not resolved');
      return;
    }
    const trimmed = (last4 || '').trim();
    if (!/^[0-9a-fA-F]{4}$/.test(trimmed)) {
      toast.error('Enter last 4 hex characters');
      return;
    }
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`/api/order/search-by-last4?userId=${encodeURIComponent(tenantUserId)}&last4=${encodeURIComponent(trimmed)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(Array.isArray(data.orders) ? data.orders : []);
      if (!data.orders?.length) toast('No matching orders found');
    } catch (e) {
      toast.error('Failed to search orders');
    } finally {
      setLoading(false);
    }
  };

  const publishUpdate = async (eventName, payload) => {
    try {
      const ch = ably.channels.get(`orders:${tenantUserId}`);
      await ch.publish(eventName, payload);
    } catch (e) {
      // Ably publish failed (order-control)
    }
  };

  const patchStatus = async (orderId, newStatus) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`/api/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setResults(prev => prev.map(o => o._id === updated._id ? updated : o));
      await publishUpdate('order.updated', updated);
      toast.success(`Order marked ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) throw new Error('Complete failed');
      const updated = await res.json();
      setResults(prev => prev.map(o => o._id === updated._id ? updated : o));
      await publishUpdate('order.updated', updated);
      toast.success('Order completed');
    } catch (e) {
      toast.error('Failed to complete');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Dismiss this order everywhere? This deletes it from database permanently.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`/api/order/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setResults(prev => prev.filter(o => o._id !== orderId));
      // Server already publishes order.deleted, but publish a legacy event too if needed
      await publishUpdate('order.deleted', { _id: orderId });
      toast.success('Order dismissed and deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const getNextStatus = (status) => {
    const flow = { pending: 'preparing', preparing: 'ready', ready: 'served', served: 'completed' };
    return flow[status];
  };

  return (
    <div className="p-4 md:p-6">
      <Header />
      {/* Spacer so content is not hidden behind fixed header */}
      <div className="h-16 md:h-20" />

      {/* Page intro */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-100 rounded-xl px-4 py-3 md:px-6 md:py-4 flex items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Order Control</h1>
            <p className="text-xs md:text-sm text-gray-600">Search any order by the last 4 characters of the Order ID and take actions instantly.</p>
          </div>
          <div className="hidden md:block text-xs text-gray-500">Tenant: <span className="font-mono">{tenantUserId || '—'}</span></div>
        </div>
      </div>

      {/* Search card */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow border border-gray-200 mt-4">
        <div className="p-4 md:p-5">
          <label className="block text-xs font-medium text-gray-700 mb-1">Last 4 of Order ID</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. 21e5"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 tracking-widest uppercase"
              maxLength={4}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={searchOrders}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-60 whitespace-nowrap"
              >
                <FiSearch /> {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={refreshResults}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                title="Refresh results"
              >
                <FiRefreshCw /> <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Tip: Accepts 0-9 and a-f (hex). Works across uppercase/lowercase.</p>
        </div>

        {/* Results */}
        <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3">
          {results.map((o) => (
            <div key={o._id} className="border border-gray-200 hover:border-amber-200 rounded-lg p-3 md:p-4 bg-white transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">{o._id}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-violet-100 text-violet-800 border-violet-200">Table #{o.tableNumber}</span>
                    <span className={statusBadge(o.status)}>{o.status}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-emerald-100 text-emerald-800 border-emerald-200">₹{Number(o.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-[12px] text-gray-600">
                    {Array.isArray(o.items) && o.items.length > 0 ? (
                      <span>{o.items.slice(0,3).map(i => i.name).join(', ')}{o.items.length > 3 ? ` +${o.items.length - 3} more` : ''}</span>
                    ) : (
                      <span>No items</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getNextStatus(o.status) && (
                    <button
                      onClick={() => patchStatus(o._id, getNextStatus(o.status))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <FiRefreshCw /> Next: {getNextStatus(o.status)}
                    </button>
                  )}
                  <button
                    onClick={() => completeOrder(o._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <FiCheckCircle /> Complete
                  </button>
                  <button
                    onClick={() => deleteOrder(o._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    <FiTrash2 /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!results.length && (
            <div className="text-center py-10 text-sm text-gray-600">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-medium">No results yet</p>
              <p className="text-gray-500 text-xs">Enter the last 4 characters of an Order ID and click Search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

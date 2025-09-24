"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAbly } from "@/lib/ably";
import { 
  FaUtensils, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaBell, 
  FaListAlt, 
  FaClipboardList, 
  FaHistory, 
  FaTable, 
  FaSync,
  FaChartLine,
  FaUsers,
  FaCog,
  FaEye,
  FaPlus,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
  FaTachometerAlt,
  FaFire,
  FaConciergeBell
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import TableDetailsModal from "@/app/components/dashboard/TableDetailsModal";
import Header from "../components/Header";
import TableBox from "../components/dashboard/TableBox";
import DashboardStats from "../components/dashboard/DashboardStats";
import { printBill } from "../components/bill/PrintBill";

// Enhanced Quick Actions with Stunning Effects
const QuickActions = ({ onRefresh, onViewHistory, onManageTables, onViewAnalytics, onViewWaiter, className = "" }) => (
  <div className={`bg-white rounded-3xl shadow-2xl border-0 overflow-hidden ${className} backdrop-blur-lg scale-90`}>
    <div className="bg-gradient-to-r from-slate-800 via-gray-900 to-black px-4 sm:px-6 py-4 border-b-0">
      <h3 className="text-lg sm:text-xl font-black text-white flex items-center">
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-3 shadow-lg animate-pulse">
          <FaTachometerAlt className="text-white text-base sm:text-lg" />
        </div>
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Quick Actions
        </span>
      </h3>
    </div>
    
    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={onRefresh}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-blue-500 to-cyan-600 text-white
                   hover:from-blue-600 hover:to-cyan-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-blue-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:rotate-180">
            <FaSync className="text-lg sm:text-xl group-hover:animate-spin" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Refresh Data
          </span>
        </button>
        
        <button
          onClick={onViewHistory}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-emerald-500 to-teal-600 text-white
                   hover:from-emerald-600 hover:to-teal-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-emerald-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-110">
            <FaHistory className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Order History
          </span>
        </button>
        
        <button
          onClick={onManageTables}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-amber-500 to-orange-600 text-white
                   hover:from-amber-600 hover:to-orange-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-amber-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:rotate-12">
            <FaTable className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Manage Tables
          </span>
        </button>
        
        <button
          onClick={onViewAnalytics}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-purple-500 to-pink-600 text-white
                   hover:from-purple-600 hover:to-pink-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-purple-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-125">
            <FaChartLine className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Analytics
          </span>
        </button>
        
        <button
          onClick={onViewWaiter}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white
                   hover:from-rose-600 hover:to-fuchsia-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-rose-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-110">
            <FaConciergeBell className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Waiter View
          </span>
        </button>
      </div>
    </div>
  </div>
);

// Utility function to group orders by table number
function groupOrdersByTable(orders) {
  return orders.reduce((acc, order) => {
    if (!acc[order.tableNumber]) acc[order.tableNumber] = [];
    acc[order.tableNumber].push(order);
    return acc;
  }, {});
}

// Main Dashboard Component
export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableModal, setTableModal] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Add this helper function to handle localStorage operations
  const getCachedOrders = () => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`cached_orders_${session?.user?.id}`);
    if (!cached) return null;
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Check if data is older than 5 minutes (300000 ms)
      if (Date.now() - timestamp < 300000) {
        return data;
      }
    } catch (e) {
      console.error('Error parsing cached orders:', e);
    }
    return null;
  };

  const cacheOrders = (orders) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `cached_orders_${session?.user?.id}`, 
        JSON.stringify({
          data: orders,
          timestamp: Date.now()
        })
      );
    } catch (e) {
      console.error('Error caching orders:', e);
    }
  };

  // Add this helper function to handle business info caching
  const getCachedBusinessInfo = () => {
    if (typeof window === 'undefined' || !session?.user?.id) return null;
    const cached = localStorage.getItem(`business_info_${session.user.id}`);
    if (!cached) return null;
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 1 hour (3600000 ms)
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    } catch (e) {
      console.error('Error parsing cached business info:', e);
    }
    return null;
  };

  const cacheBusinessInfo = (data) => {
    if (typeof window === 'undefined' || !session?.user?.id) return;
    try {
      localStorage.setItem(
        `business_info_${session.user.id}`,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (e) {
      console.error('Error caching business info:', e);
    }
  };

  // Enhanced Stats calculation with proper item status tracking
  const stats = useMemo(() => {
    let pending = 0;
    let preparing = 0;
    let ready = 0;
    let served = 0;
    let totalItems = 0;
    let totalRevenue = 0;
    const tableNumbers = new Set();

    // Process each order
    orders.forEach(order => {
      const items = order.items || order.cart || [];
      totalItems += items.length;
      
      // Add table number to set if it exists
      if (order.tableNumber) {
        tableNumbers.add(order.tableNumber);
      }

      // Calculate revenue
      totalRevenue += order.totalAmount || 
                     items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

      // Count items by status
      items.forEach(item => {
        // If item has status, use it. Otherwise, use order status
        const status = item.status || order.status || 'pending';
        
        switch (status) {
          case 'pending':
            pending++;
            break;
          case 'preparing':
            preparing++;
            break;
          case 'ready':
            ready++;
            break;
          case 'served':
            served++;
            break;
          default:
            // If status is unknown, count as pending
            pending++;
        }
      });
    });

    return {
      totalItems,
      pendingItems: pending,
      preparingItems: preparing,
      readyItems: ready,
      servedItems: served,
      totalRevenue,
      activeTables: tableNumbers.size
    };
  }, [orders]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Try to get from cache first
    const cachedInfo = getCachedBusinessInfo();
    if (cachedInfo?.name) {
      setBusinessName(cachedInfo.name);
    }

    // Fetch fresh data
    const fetchBusinessInfo = async () => {
      try {
        const res = await fetch('/api/me/user?userId=' + session.user.id, {
          // Prevent caching to ensure fresh data
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Update cache with fresh data
          cacheBusinessInfo(data);
          // Only update state if different from current
          if (data.name !== businessName) {
            setBusinessName(data.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch business name", err);
        // If we don't have any name yet, show error
        if (!businessName) {
          toast.error('Failed to load business information');
        }
      }
    };
    
    fetchBusinessInfo();
    fetchOrders();
    
    // Set up real-time updates
    const client = getAbly();
    if (!client) return;

    const channel = client.channels.get(`orders:${session.user.id}`);
    const events = ['order.created', 'order.updated', 'order.deleted', 'order-created', 'order-updated'];

    const handleMessage = (message) => {
      handleRealtimeOrderUpdate(message.name, message.data);
    };

    events.forEach(event => {
      channel.subscribe(event, handleMessage);
    });

    return () => {
      events.forEach(event => {
        channel.unsubscribe(event, handleMessage);
      });
    };
  }, [session?.user?.id]);

  const fetchOrders = async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      setLoading(true);
      
      let authHeaders = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/order?userId=${session.user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        // Prevent browser cache
        cache: 'no-store',
        // Add timestamp to prevent any intermediate caching
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      // Filter out cancelled orders at fetch level - don't fetch them at all
      const filteredData = data.filter(o => o.status !== 'cancelled');
      
      // Only update state if data has actually changed
      setOrders(prev => {
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(filteredData);
        
        if (prevString !== newString) {
          // Update cache with fresh data
          cacheOrders(filteredData);
          return filteredData;
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Only show error if we don't have any cached data
      if (!getCachedOrders()) {
        toast.error('Failed to load orders. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Realtime Order Update Handling
  const handleRealtimeOrderUpdate = (eventType, data) => {
    if (!data) return;

    const normalized = {
      _id: data._id || data.id,
      tableNumber: data.tableNumber,
      items: data.items || data.cart || [],
      status: data.status,
      paymentStatus: data.paymentStatus,
      totalAmount: data.totalAmount,
      createdAt: data.createdAt || data.timestamp,
      message: data.message || data.msg
    };

    setOrders(prev => {
      let updatedOrders;
      
      if (eventType === 'order.created' || eventType === 'order-created') {
        const exists = prev.some(o => o._id === normalized._id);
        if (exists) return prev;
        updatedOrders = [normalized, ...prev];
      } 
      else if (eventType === 'order.updated' || eventType === 'order-updated') {
        if (normalized.status === 'completed' || normalized.status === 'cancelled') {
          updatedOrders = prev.filter(o => o._id !== normalized._id);
        } else {
          updatedOrders = prev.map(o => (o._id === normalized._id ? { ...o, ...normalized } : o));
        }
      }
      else if (eventType === 'order.deleted') {
        updatedOrders = prev.filter(o => o._id !== normalized._id);
      } else {
        return prev; // No changes
      }

      // Update cache whenever orders change
      if (updatedOrders) {
        cacheOrders(updatedOrders);
        return updatedOrders;
      }
      return prev;
    });
  };

  const completeOrder = async (orderId) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
          ...(typeof window !== 'undefined' ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {})
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

      const updatedOrder = await response.json();

      const client = getAbly();
      if (client) {
        const channel = client.channels.get(`orders:${session.user.id}`);
        const payload = {
          ...updatedOrder,
          timestamp: Date.now()
        };
        await channel.publish("order.updated", payload);
        await channel.publish("order-updated", payload);
      }
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PATCH', // Changed from PUT to PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "cancelled" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }

      const updatedOrder = await response.json();

      const client = getAbly();
      if (client) {
        const channel = client.channels.get(`orders:${session.user.id}`);
        const payload = {
          ...updatedOrder,
          timestamp: Date.now()
        };
        await channel.publish("order.updated", payload);
        await channel.publish("order-updated", payload);
      }
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const markOrderPaid = async (orderId, gstDetails) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/order/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        gstDetails: gstDetails,
        triggerPaymentEvent: true // Flag to trigger Ably payment event
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to mark order paid (${res.status}): ${text}`);
    }
    return res.json();
  };

  const cancelTableOrders = async (tableNumber, tableOrders) => {
    try {
      const active = tableOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      if (active.length === 0) return;
      await Promise.all(active.map(o => cancelOrder(o._id)));
      toast.success(`Cancelled ${active.length} order(s) for Table ${tableNumber}`);
      await fetchOrders();
    } catch (e) {
      toast.error('Failed to cancel orders');
    }
  };

  const markTablePaid = async (tableNumber, tableOrders, allOrdersForTable, gstDetails) => {
    try {
      // consider all non-cancelled & not already paid orders
      const candidates = (allOrdersForTable || tableOrders).filter(o => o.status !== 'cancelled' && !isOrderPaid(o));
      
      if (candidates.length === 0) {
        toast.info(`All orders already paid for Table ${tableNumber}`);
        return;
      }
      await Promise.all(candidates.map(o => markOrderPaid(o._id, gstDetails)));
      toast.success(`Marked ${candidates.length} order(s) paid for Table ${tableNumber}`);
      await fetchOrders();
    } catch (e) {
      toast.error('Failed to mark orders paid');
    }
  };

  const getOrderTableKey = (o) => {
    const t = o?.table;
    // Handle nested table objects or direct fields
    const candidate = (
      o?.tableNumber ??
      (typeof t === 'object' ? (t?.number ?? t?.name ?? t?.id ?? t?._id) : t) ??
      o?.table_no ??
      o?.tableId ??
      o?.table_id ??
      o?.tableNo ??
      o?.table_name
    );
    return candidate != null ? String(candidate) : '';
  };

  const isOrderPaid = (o) => {
    // Only hide orders when both status is 'completed' AND paymentStatus is 'paid'
    return o?.status === 'completed' && o?.paymentStatus === 'paid';
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return [
      address.street,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean).join(', ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePrintBill = (tableNumber, orders) => {
    printBill(tableNumber, orders, session);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Modern Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 sm:mb-12 mt-20 sm:mt-15 lg:mt-15 xl:mt-15 md:mt-15">
          <div className="flex flex-row items-center gap-4">
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-4 rounded-3xl mr-0 sm:mr-6 mb-4 sm:mb-0 self-start">
              <FaUtensils className="text-white text-xl sm:text-3xl" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl text-gray-600">Welcome back,</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 -mt-1">
                {businessName}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg mt-2">
                Manage your orders and operations efficiently
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <FaFire className="mr-2 text-orange-500" />
                <span>Real-time updates enabled</span>
              </div>
            </div>
          </div>
          
          
        </div>

        {/* Enhanced Quick Actions Panel */}
        <div className="mb-6">
          <QuickActions
            onRefresh={fetchOrders}
            onViewHistory={() => router.push('/order-history')}
            onManageTables={() => router.push('/table')}
            onViewAnalytics={() => router.push('/analytics')}
            onViewWaiter={() => window.open('/waiter', '_blank', 'noopener,noreferrer')}
          />
        </div>

        {/* Enhanced Stats Cards Grid - Fully Responsive */}
        <div className="mb-6">
          <DashboardStats stats={stats} />
        </div>

        {/* Table Management Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><FaTable className="mr-2 text-blue-600"/>Tables</h2>
            <div className="text-xs text-gray-500">{Object.keys(groupOrdersByTable(orders)).length} active</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-6 lg:p-6 md:p-6 min-h-[300px] h-auto overflow-hidden">
            {Object.keys(groupOrdersByTable(orders)).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full mb-4">
                  <FaTable className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Tables</h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  Tables with active orders will appear here. Start taking orders to see table activity.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FaUtensils className="text-amber-500" />
                  <span>Ready to serve your customers</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 sm:gap-8 lg:gap-10 auto-rows-max">
                {Object.keys(groupOrdersByTable(orders)).map((tn) => {
              const ordersForTable = groupOrdersByTable(orders)[tn];
              // Debug: Log orders for this table
              
              
              // Show all orders except those that are completed AND paid
              const activeOrders = ordersForTable.filter(o => !isOrderPaid(o));
              
              const total = activeOrders.reduce((sum, o)=> sum + (o.totalAmount || (o.items||o.cart||[]).reduce((s,i)=>s+i.price*i.quantity,0)), 0);
              const hasOrders = activeOrders.length > 0;
              const hasPaid = false; // Since we're showing all non-completed orders
              
              // Only render table if it has active orders
              if (!hasOrders) return null;
              
              return (
                <TableBox
                  key={tn}
                  tableNumber={tn}
                  totalAmount={total}
                  hasOrders={hasOrders}
                  hasPaid={hasPaid}
                  onView={() => setTableModal({ tableNumber: tn, orders: activeOrders })}
                  onCancel={() => cancelTableOrders(tn, activeOrders)}
                  onMarkPaid={() => markTablePaid(tn, activeOrders, activeOrders, ordersForTable[0]?.gstDetails)}
                  gstDetails={ordersForTable[0]?.gstDetails}
                />
              );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard content area ready for new sections */}
        <div className="space-y-6">
          {/* Content will be added here as per user requirements */}
        </div>
        {tableModal && (
          <TableDetailsModal 
            tableNumber={tableModal.tableNumber} 
            orders={tableModal.orders} 
            onClose={() => setTableModal(null)} 
            onPrint={() => handlePrintBill(tableModal.tableNumber, tableModal.orders)}
            onMarkPaid={(gstDetails) => {
              markTablePaid(tableModal.tableNumber, tableModal.orders, tableModal.orders, gstDetails);
              setTableModal(null);
            }}
            userProfile={session?.user}
          />
        )}
      </main>
    </div>
  );
}

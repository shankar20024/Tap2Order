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
  FaConciergeBell,
  FaExpand,
  FaCompress,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import TableDetailsModal from "@/app/components/dashboard/TableDetailsModal";
import Header from "../components/Header";
import TableBox from "../components/dashboard/TableBox";
import DashboardStats from "../components/dashboard/DashboardStats";
import { printBill } from "../components/bill/PrintBill";

// Enhanced Quick Actions with Stunning Effects
const QuickActions = ({ onRefresh, onViewHistory, onManageTables, onViewAnalytics, onViewWaiter, onTakeaway, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl border-0 overflow-hidden ${className} backdrop-blur-lg w-full`}>
      <div 
        className="bg-gradient-to-r from-slate-800 via-gray-900 to-black px-4 sm:px-6 py-4 border-b-0 cursor-pointer hover:from-slate-700 hover:via-gray-800 hover:to-gray-900 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-3 shadow-lg animate-pulse">
              <FaTachometerAlt className="text-white text-base sm:text-lg" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Quick Actions
            </span>
          </div>
          <div className="text-white/80 hover:text-white transition-colors">
            {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
          </div>
        </h3>
      </div>
    
      {isExpanded && (
        <div className="p-3 xs:p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-4">
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
          onClick={onTakeaway}
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
            Takeaway
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
      )}
    </div>
  );
};

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const markOrderPaid = async (orderId, gstDetails, paymentMethod = 'cash') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/order/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
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

  const markTablePaid = async (tableNumber, tableOrders, allOrdersForTable, gstDetails, paymentMethod = 'cash') => {
    try {
      // consider all non-cancelled & not already paid orders
      const candidates = (allOrdersForTable || tableOrders).filter(o => o.status !== 'cancelled' && !isOrderPaid(o));
      
      if (candidates.length === 0) {
        toast.info(`All orders already paid for Table ${tableNumber}`);
        return;
      }
      await Promise.all(candidates.map(o => markOrderPaid(o._id, gstDetails, paymentMethod)));
      toast.success(`Marked ${candidates.length} order(s) paid for Table ${tableNumber} via ${paymentMethod}`);
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

  // Fetch bill details from database
  const fetchBillDetails = async (billNumber) => {
    try {
      const response = await fetch(`/api/bills/search?billNumber=${billNumber}&userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        return data.bill;
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
    }
    return null;
  };

  // Fetch bill by order ID
  const fetchBillByOrderId = async (orderId) => {
    try {
      const response = await fetch(`/api/bills/by-order?orderId=${orderId}&userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        return data.bill;
      }
    } catch (error) {
      console.error('Error fetching bill by order ID:', error);
    }
    return null;
  };

  // Increment bill print count
  const incrementBillPrintCount = async (billNumber) => {
    try {
      await fetch(`/api/bills/print-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billNumber, userId: session.user.id })
      });
    } catch (error) {
      console.error('Error incrementing print count:', error);
    }
  };

  // Create bill for table orders that don't have one
  const createBillForTableOrders = async (tableNumber, orders) => {
    try {
      // Prepare items from all orders
      const allItems = orders.flatMap(order => 
        (order.items || []).map(item => ({
          _id: item.menuItemId || item._id,
          name: item.name,
          price: item.price,
          selectedSize: item.selectedSize || 'Regular',
          quantity: item.quantity || 1,
          category: item.category,
          subcategory: item.subcategory
        }))
      );

      // Fetch user's GST details for proper calculation
      let userGstRate = 0;
      try {
        const businessResponse = await fetch(`/api/business/info?userId=${session.user.id}`);
        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          userGstRate = businessData.gstDetails?.taxRate || 0;
          console.log('User GST rate from business info:', userGstRate);
        }
      } catch (error) {
        console.error('Error fetching business GST rate:', error);
      }

      // Calculate totals with proper GST using user's rate
      const subtotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gst = userGstRate > 0 ? Math.round(subtotal * (userGstRate / 100)) : 0;
      const total = subtotal + gst;
      
      console.log('Dashboard GST Calculation:');
      console.log('Subtotal:', subtotal);
      console.log(`GST (${userGstRate}%):`, gst);
      console.log('Total:', total);

      // Get customer info from most recent order
      const mostRecentOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const customerInfo = mostRecentOrder?.customerInfo || {};

      const billData = {
        items: allItems,
        customerName: customerInfo.name || 'Guest',
        customerPhone: customerInfo.phone || '',
        tableNumber: tableNumber,
        orderType: 'dine-in',
        paymentMethod: 'cash',
        notes: `Table ${tableNumber} - Dashboard Print`,
        subtotal,
        gst,
        total,
        orderId: mostRecentOrder._id // Add most recent order ID for linking
      };

      const response = await fetch('/api/bills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bill created for table orders:', data.bill?.billNumber);
        return data.bill;
      } else {
        console.error('Failed to create bill for table orders');
        return null;
      }
    } catch (error) {
      console.error('Error creating bill for table orders:', error);
      return null;
    }
  };

  // Update orders with bill number
  const updateOrdersWithBillNumber = async (orders, billNumber, tokenNumber) => {
    try {
      for (const order of orders) {
        if (order._id) {
          const updateData = { billNumber };
          // Only include token number if it's provided (for billing orders only)
          if (tokenNumber !== null && tokenNumber !== undefined) {
            updateData.tokenNumber = tokenNumber;
          }
          
          await fetch(`/api/order/${order._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
        }
      }
      console.log('Orders updated with bill number:', billNumber, tokenNumber ? `and token: ${tokenNumber}` : '(no token)');
    } catch (error) {
      console.error('Error updating orders with bill number:', error);
    }
  };

  const handlePrintBill = async (tableNumber, orders) => {
    try {
      // Get the first order to extract bill information
      const firstOrder = orders[0];
      
      // First check if any order has a billNumber
      let existingBill = null;
      if (firstOrder?.billNumber) {
        existingBill = await fetchBillDetails(firstOrder.billNumber);
      }
      
      // If no billNumber, check if bill exists for any order ID
      if (!existingBill) {
        for (const order of orders) {
          const billByOrderId = await fetchBillByOrderId(order._id);
          if (billByOrderId) {
            existingBill = billByOrderId;
            // Update order with bill number for future reference
            await updateOrdersWithBillNumber([order], billByOrderId.billNumber, billByOrderId.tokenNumber);
            break;
          }
        }
      }
      
      if (existingBill) {
        // Use existing bill - increment print count
        await incrementBillPrintCount(existingBill.billNumber);
        
        const printData = {
          orderNumber: existingBill.billNumber,
          billNumber: existingBill.billNumber,
          tokenNumber: existingBill.tokenNumber || null,
          customerName: existingBill.customerInfo?.name || firstOrder.customerInfo?.name || 'Guest',
          customerPhone: existingBill.customerInfo?.phone || firstOrder.customerInfo?.phone || '',
          date: existingBill.date || new Date().toLocaleString('en-IN'),
          items: existingBill.items || orders.flatMap(order => order.items || []),
          subtotal: existingBill.pricing?.subtotal || orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          gst: existingBill.pricing?.gst || 0,
          total: existingBill.pricing?.total || orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        };
        
        console.log('Dashboard printing with existing bill (print count incremented):', printData);
        await printBill(`Table ${tableNumber}`, orders, session, printData);
      } else {
        // Create new bill only if none exists
        console.log('No existing bill found, creating new bill for table orders');
        const createdBill = await createBillForTableOrders(tableNumber, orders);
        
        if (createdBill) {
          const printData = {
            orderNumber: createdBill.billNumber,
            billNumber: createdBill.billNumber,
            tokenNumber: createdBill.tokenNumber || null,
            customerName: createdBill.customerInfo?.name || 'Guest',
            customerPhone: createdBill.customerInfo?.phone || '',
            date: new Date().toLocaleString('en-IN'),
            items: createdBill.items || orders.flatMap(order => order.items || []),
            subtotal: createdBill.pricing?.subtotal || 0,
            gst: createdBill.pricing?.gst || 0,
            total: createdBill.pricing?.total || 0
          };
          
          console.log('Dashboard printing with newly created bill:', printData);
          await printBill(`Table ${tableNumber}`, orders, session, printData);
          
          // Update orders with bill number for future reference
          await updateOrdersWithBillNumber(orders, createdBill.billNumber, createdBill.tokenNumber);
        } else {
          // Fallback to original print method
          console.log('Failed to create bill, using fallback print method');
          await printBill(tableNumber, orders, session);
        }
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      // Fallback to original method if error occurs
      await printBill(tableNumber, orders, session);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header title="Dashboard" />
      {isExpanded && (
        <div className="fixed inset-0 bg-white z-[70] overflow-auto">
          {/* Expanded View Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaTable className="mr-3 text-blue-600"/>
              Tables Overview
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2"
              title="Exit full screen"
            >
              <FaCompress className="text-gray-600" />
              <span className="text-sm text-gray-600">Exit</span>
            </button>
          </div>
          
          {/* Expanded Tables Grid */}
          <div className="p-6">
            {Object.keys(groupOrdersByTable(orders)).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-8 rounded-full mb-6">
                  <FaTable className="text-6xl text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">No Active Tables</h3>
                <p className="text-gray-600 mb-6 max-w-md text-lg">
                  Tables with active orders will appear here. Start taking orders to see table activity.
                </p>
                <div className="flex items-center space-x-2 text-gray-500">
                  <FaUtensils className="text-amber-500" />
                  <span>Ready to serve your customers</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 auto-rows-max">
                {Object.keys(groupOrdersByTable(orders)).map((tn) => {
                  const ordersForTable = groupOrdersByTable(orders)[tn];
                  const activeOrders = ordersForTable.filter(o => !isOrderPaid(o));
                  const total = activeOrders.reduce((sum, o)=> sum + (o.totalAmount || (o.items||o.cart||[]).reduce((s,i)=>s+i.price*i.quantity,0)), 0);
                  const hasOrders = activeOrders.length > 0;
                  const hasPaid = false;
                  
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
      )}
      <main className="p-3 xs:p-4 sm:p-6 lg:p-8 w-full max-w-full">
        {/* Modern Dashboard Header */}
        <div className="mb-4 mt-20 sm:mt-16 lg:mt-16 w-full max-w-full">
          <div className="flex items-start gap-2 xs:gap-3 sm:gap-4">
            {/* Icon Container */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-2 xs:p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
              <FaUtensils className="text-white text-lg xs:text-xl sm:text-2xl" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <p className="text-sm xs:text-base sm:text-lg text-gray-600 mb-1">Welcome back,</p>
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight break-words">
                  {businessName}
                </h1>
              </div>
              
              <p className="text-gray-600 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3">
                Manage your orders and operations efficiently
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions Panel */}
        <div className="mb-4">
          <QuickActions
            onRefresh={fetchOrders}
            onViewHistory={() => router.push('/order-history')}
            onManageTables={() => router.push('/table')}
            onViewAnalytics={() => router.push('/analytics')}
            onViewWaiter={() => window.open('/waiter', '_blank', 'noopener,noreferrer')}
            onTakeaway={() => router.push('/takeaway')}
          />
        </div>

        {/* Enhanced Stats Cards Grid - Fully Responsive */}
        <div className="mb-6">
          <DashboardStats stats={stats} />
        </div>

        {/* Table Management Grid */}
        <div className="mb-8 w-full max-w-full">
          <div className="flex items-center justify-between mb-3 xs:mb-4">
            <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800 flex items-center"><FaTable className="mr-1 xs:mr-2 text-sm xs:text-base sm:text-lg text-blue-600"/>Tables</h2>
            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-500">{Object.keys(groupOrdersByTable(orders)).length} active</div>
          </div>
          <div className="relative bg-white rounded-lg xs:rounded-xl shadow-md sm:shadow-lg border border-gray-200 p-3 xs:p-4 sm:p-6 md:p-6 lg:p-6 min-h-[200px] xs:min-h-[250px] sm:min-h-[300px] h-auto overflow-hidden w-full max-w-full">
            {/* Expand Icon */}
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 w-7 h-7 xs:w-8 xs:h-8 bg-gray-100 hover:bg-gray-200 rounded-md xs:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group z-10"
              title="Expand to full screen"
            >
              <FaExpand className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>
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
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 auto-rows-max w-full">
                {Object.keys(groupOrdersByTable(orders)).map((tn) => {
              const ordersForTable = groupOrdersByTable(orders)[tn];
              
              
              
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
            onMarkPaid={(gstDetails, paymentMethod) => {
              markTablePaid(tableModal.tableNumber, tableModal.orders, tableModal.orders, gstDetails, paymentMethod);
              setTableModal(null);
            }}
            userProfile={session?.user}
          />
        )}
      </main>
    </div>
  );
}

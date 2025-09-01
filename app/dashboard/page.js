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
  FaPrint,
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
import PrinterSettingsModal from '../components/dashboard/PrinterSettingsModal';
import thermalPrinter from "@/lib/thermalPrinter";
import TableBox from "../components/dashboard/TableBox";
import DashboardStats from "../components/dashboard/DashboardStats";


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

// Advanced Filter and Search Component


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
  const [newOrderTables, setNewOrderTables] = useState([]);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [billOrders, setBillOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableModal, setTableModal] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [businessName, setBusinessName] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Enhanced Stats calculation with trends - Updated to count items instead of orders
  const stats = useMemo(() => ({
    totalItems: [...orders, ...billOrders].reduce((sum, o) => sum + (o.items || o.cart || []).length, 0),
    pendingItems: orders.reduce((sum, o) => {
      if (o.status === 'pending') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'pending').length;
    }, 0),
    preparingItems: orders.reduce((sum, o) => {
      if (o.status === 'preparing') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'preparing').length;
    }, 0),
    readyItems: orders.reduce((sum, o) => {
      if (o.status === 'ready') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'ready').length;
    }, 0),
    servedItems: [...orders, ...billOrders].reduce((sum, o) => {
      if (o.status === 'served') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'served').length;
    }, 0),
    totalRevenue: [...orders, ...billOrders].reduce((sum, o) => {
      // Use GST grandTotal if available, otherwise fall back to totalAmount
      
      // Fallback to calculating from items if no totalAmount
      const items = o.items || o.cart || [];
      return sum + (o.totalAmount || items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0));
    }, 0),
    activeTables: new Set([...orders.map(o => o.tableNumber), ...billOrders.map(o => o.tableNumber)]).size
  }), [orders, billOrders]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchBusinessInfo = async () => {
      try {
        const res = await fetch('/api/me/user?userId=' + session.user.id);
        if (res.ok) {
          const data = await res.json();
          setBusinessName(data.name);
        }
      } catch (err) {
        console.error("Failed to fetch business name", err);
      }
    };

    fetchBusinessInfo();
    fetchOrders();

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

    if (eventType === 'order.created' || eventType === 'order-created') {
      setOrders(prev => {
        const exists = prev.some(o => o._id === normalized._id);
        if (exists) return prev;
        
        setNewOrderTables(prevTables => {
          if (!prevTables.includes(normalized.tableNumber)) {
            setHasNewOrder(true);
            setTimeout(() => setHasNewOrder(false), 5000);
            return [...prevTables, normalized.tableNumber];
          }
          return prevTables;
        });
        
        return [normalized, ...prev];
      });
      return;
    }

    if (eventType === 'order.updated' || eventType === 'order-updated') {
      if (normalized.status === 'served' && normalized.paymentStatus !== 'paid') {
        setOrders(prev => prev.filter(o => o._id !== normalized._id));
        setBillOrders(prev => {
          const exists = prev.some(o => o._id === normalized._id);
          return exists ? prev.map(o => (o._id === normalized._id ? normalized : o)) : [...prev, normalized];
        });
        return;
      }
      if (normalized.status === 'completed' || normalized.status === 'cancelled') {
        setOrders(prev => prev.filter(o => o._id !== normalized._id));
        setBillOrders(prev => prev.filter(o => o._id !== normalized._id));
        return;
      }
      setOrders(prev => prev.map(o => (o._id === normalized._id ? { ...o, ...normalized } : o)));
      return;
    }

    if (eventType === 'order.deleted') {
      setOrders(prev => prev.filter(o => o._id !== normalized._id));
      setBillOrders(prev => prev.filter(o => o._id !== normalized._id));
      return;
    }
  };

  const fetchOrders = async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      let authHeaders = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/order?userId=${session.user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        }
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
      setOrders(filteredData);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
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

  const thermalPrintBill = async (tableNumber, items, total, orderIds, orders) => {
    try {
      // Quick check for printer availability without triggering permissions
      const isAvailable = await thermalPrinter.checkPrinterAvailability();
      
      if (isAvailable) {
        // Try to connect (will use cached permission if already granted)
        await thermalPrinter.connect();
        const printers = await thermalPrinter.getPrinters();
        
        if (printers.length > 0) {
          // Direct thermal printing - skip preview
          
          // Get customer name from orders
          const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
            ? orders[0].customerInfo.name 
            : 'Walk-in Customer';

          // Generate bill number
          const billNumberResponse = await fetch('/api/bill-number', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          let billNumber = 1;
          if (billNumberResponse.ok) {
            const billData = await billNumberResponse.json();
            billNumber = billData.billNumber;
          }

          // Fetch business info for receipt
          const profileResponse = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          });
          
          let businessInfo = null;
          if (profileResponse.ok) {
            businessInfo = await profileResponse.json();
          }

          // Prepare receipt data with same format as preview
          const receiptData = {
            tableNumber: parseInt(tableNumber),
            orderIds: orderIds || [],
            items: items,
            total: parseFloat(total),
            itemsTotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            customerName: customerName,
            timestamp: Date.now(),
            billNumber: billNumber,
            businessInfo: businessInfo
          };

          // Print directly using thermal printer
          await thermalPrinter.printReceipt(receiptData);
          toast.success('Bill printed successfully!');
          return;
        }
      }
    } catch (error) {
      // Don't show error toast, just fall back to preview silently
    }

    // Fallback to preview if thermal printing fails or not available
    const itemsParam = encodeURIComponent(JSON.stringify(items));
    const ordersParam = (orderIds || []).join(',');
    
    // Get customer name from orders
    const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
      ? orders[0].customerInfo.name 
      : 'Walk-in Customer';
    
    const url = `/bill-preview?table=${tableNumber}&items=${itemsParam}&total=${total}&orders=${ordersParam}&customer=${encodeURIComponent(customerName)}`;
    router.push(url);
  };

  const fallbackBrowserPrint = (tableNumber, items, total, orderIds, orders) => {
    // Also redirect to bill preview for consistency
    const itemsParam = encodeURIComponent(JSON.stringify(items));
    const ordersParam = (orderIds || []).join(',');
    
    // Get customer name from orders
    const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
      ? orders[0].customerInfo.name 
      : 'Walk-in Customer';
    
    const url = `/bill-preview?table=${tableNumber}&items=${itemsParam}&total=${total}&orders=${ordersParam}&customer=${encodeURIComponent(customerName)}`;
    router.push(url);
  };

  const markOrderPaid = async (orderId, gstDetails) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/order/${orderId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        gstDetails: gstDetails
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

  const refreshPrinters = async () => {
    try {
      const printers = await thermalPrinter.getAvailablePrinters();
      setAvailablePrinters(printers);
    } catch (error) {
      // Don't show error toast, just fall back to preview silently
    }
  };

  const handlePrinterChange = (printerName) => {
    setSelectedPrinter(printerName);
    thermalPrinter.setPrinter(printerName);
    toast.success(`Printer selected: ${printerName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      <Header onRefresh={fetchOrders} onSettingsClick={() => setShowPrinterSettings(true)} />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-26 sm:pt-24 pb-8">
        
        {/* Modern Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 sm:mb-12">
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
          
          {/* Printer Selection Section */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FaPrint className="text-blue-600 mr-3 text-xl" />
                <h3 className="text-lg font-semibold text-gray-800">Thermal Printer</h3>
              </div>
              <button
                onClick={refreshPrinters}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                title="Refresh Printers"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {availablePrinters.length > 0 ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Printer:
                </label>
                <select
                  value={selectedPrinter || ''}
                  onChange={(e) => handlePrinterChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                >
                  <option value="">Choose a printer...</option>
                  {availablePrinters.map((printer, index) => (
                    <option key={index} value={printer.name}>
                      {printer.name} {printer.name === selectedPrinter ? '(Selected)' : ''}
                    </option>
                  ))}
                </select>
                
                {selectedPrinter && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ready to print to: {selectedPrinter}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <FaPrint className="mx-auto text-gray-400 text-3xl mb-2" />
                <p className="text-gray-500 text-sm">No printers found</p>
                <button
                  onClick={() => setShowPrinterSettings(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Configure Printer Settings
                </button>
              </div>
            )}
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 min-h-[300px] h-auto overflow-hidden">
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
                  onPrint={() => thermalPrintBill(tn, activeOrders.flatMap(order => order.items || order.cart || []), total, activeOrders.map(o => o._id), activeOrders)}
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
            onPrint={() => thermalPrintBill(tableModal.tableNumber, tableModal.orders.flatMap(order => order.items || order.cart || []), tableModal.orders.reduce((sum, o) => sum + (o.totalAmount || (o.items||o.cart||[]).reduce((s,i)=>s+i.price*i.quantity,0)), 0), tableModal.orders.map(o => o._id), tableModal.orders)}
            onMarkPaid={(gstDetails) => {
              markTablePaid(tableModal.tableNumber, tableModal.orders, tableModal.orders, gstDetails);
              setTableModal(null);
            }}
            userProfile={session?.user}
          />
        )}
        {showPrinterSettings && (
          <PrinterSettingsModal
            isOpen={showPrinterSettings}
            onClose={() => setShowPrinterSettings(false)}
            onSave={(settings) => {
              // Reinitialize printer with new settings
              initializePrinter();
            }}
          />
        )}
      </div>
    </div>
  );
}

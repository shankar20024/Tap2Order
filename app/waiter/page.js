'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { FiClock, FiCheck, FiAlertCircle, FiUsers, FiRefreshCw, FiCheckCircle, FiUser, FiX, FiHelpCircle } from 'react-icons/fi';
import ably from '@/lib/ably';

export default function WaiterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orderChannel, setOrderChannel] = useState(null);
  const [tableChannel, setTableChannel] = useState(null);
  const [hotelName, setHotelName] = useState('');

  // Tenant userId resolution
  const tenantUserId = useMemo(() => {
    const base = session?.user?.id;
    const isStaff = session?.user?.role === 'staff';
    const normalize = (val) => {
      if (!val) return undefined;
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val.$oid) return String(val.$oid);
      try { return String(val); } catch { return undefined; }
    };
    
    console.log('[Waiter] Debug tenant resolution:', {
      isStaff,
      sessionUserId: base,
      sessionHotelOwner: session?.user?.hotelOwner,
      storageUserId: typeof window !== 'undefined' ? localStorage.getItem('selectedHotelUserId') : null
    });
    
    // Debug: Full session object
    console.log('[Waiter] Full session object:', session);
    
    // TEMPORARY FIX: Force hotel owner ID for staff user
    if (base === '68a06ff31151e8e48efd5ff2') {
      console.log('[Waiter] Detected staff user, forcing hotel owner ID');
      return '683b0186bd26b46458517048';
    }
    
    if (isStaff) {
      const fromSession = normalize(session?.user?.hotelOwner);
      if (fromSession) return fromSession; // prefer session-provided owner id
      if (typeof window === 'undefined') return undefined;
      const fromStorage = normalize(localStorage.getItem('selectedHotelUserId'));
      console.log('[Waiter] Staff tenant resolved to:', fromStorage);
      return fromStorage || undefined;
    }
    // owners/admins
    console.log('[Waiter] Owner tenant resolved to:', normalize(base));
    return normalize(base);
  }, [session?.user?.id, session?.user?.role, session?.user?.hotelOwner]);

  // Fetch hotel owner's name from User schema
  const fetchHotelOwnerName = async (ownerId) => {
    if (!ownerId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/user/${ownerId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (response.ok) {
        const userData = await response.json();
        const name = userData.hotelName || userData.name || userData.email || 'Unknown Hotel';
        setHotelName(name);
        console.log('[Waiter] Hotel owner name:', name);
      } else {
        console.error('[Waiter] Failed to fetch hotel owner name:', response.status);
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const storedName = localStorage.getItem('selectedHotelName');
          setHotelName(storedName || 'Unknown Hotel');
        }
      }
    } catch (error) {
      console.error('[Waiter] Error fetching hotel owner name:', error);
      // Fallback to localStorage if API fails
      if (typeof window !== 'undefined') {
        const storedName = localStorage.getItem('selectedHotelName');
        setHotelName(storedName || 'Unknown Hotel');
      }
    }
  };

  // Redirect if not authenticated AND no JWT token (support staff JWT-only flow)
  useEffect(() => {
    if (status === 'unauthenticated') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        router.push('/login');
      }
    }
  }, [status, router]);

  // If staff and no tenantUserId (not selected), force re-select
  useEffect(() => {
    if (session?.user?.role === 'staff' && !tenantUserId) {
      toast.error('Please select a hotel to continue');
      router.push('/login');
    }
  }, [session?.user?.role, tenantUserId, router]);

  // Initialize Ably and fetch initial data on tenant change
  useEffect(() => {
    if (!tenantUserId) return;
    console.log('[Waiter] tenantUserId:', tenantUserId);

    // Fetch hotel owner's name from database
    fetchHotelOwnerName(tenantUserId);

    initializeAbly();
    fetchData();
    return () => {
      try {
        orderChannel?.unsubscribe?.();
        tableChannel?.unsubscribe?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantUserId]);

  const initializeAbly = async () => {
    try {
      // Connection status monitoring
      ably.connection.on('connected', () => {
        setIsConnected(true);
        toast.success('Connected to real-time updates');
      });

      ably.connection.on('disconnected', () => {
        setIsConnected(false);
        toast.error('Disconnected from real-time updates');
      });

      ably.connection.on('failed', () => {
        setIsConnected(false);
        toast.error('Failed to connect to real-time updates');
      });

      // Subscribe to order updates (use tenantUserId)
      const orderCh = ably.channels.get(`orders:${tenantUserId}`);
      orderCh.subscribe(['order.created', 'order.updated', 'order.deleted'], (message) => {
        handleOrderUpdate(message);
      });
      // Legacy compatibility (QR may publish these)
      orderCh.subscribe('new-order', (msg) => handleOrderUpdate({ name: 'order.created', data: msg.data }));
      orderCh.subscribe('order-updated', (msg) => handleOrderUpdate({ name: 'order.updated', data: msg.data }));
      console.log('[Waiter] Subscribed orders channel:', `orders:${tenantUserId}`);
      setOrderChannel(orderCh);

      // Subscribe to table updates (use tenantUserId)
      const tableCh = ably.channels.get(`tables:${tenantUserId}`);
      tableCh.subscribe(['table.created', 'table.updated', 'table.deleted'], (message) => {
        handleTableUpdate(message);
      });
      console.log('[Waiter] Subscribed tables channel:', `tables:${tenantUserId}`);
      setTableChannel(tableCh);

    } catch (error) {
      console.error('Error initializing Ably:', error);
      toast.error('Failed to initialize real-time connection');
    }
  };

  const handleOrderUpdate = (message) => {
    const { name: eventType, data: orderData } = message;
    
    switch (eventType) {
      case 'order.created':
        setOrders(prev => {
          const existing = prev.find(order => order._id === orderData._id);
          if (existing) return prev;
          return [...prev, orderData];
        });
        toast.success(`New order received for Table ${orderData.tableNumber}`);
        break;
        
      case 'order.updated':
        setOrders(prev => prev.map(order => 
          order._id === orderData._id ? orderData : order
        ));
        toast.info(`Order updated for Table ${orderData.tableNumber}`);
        break;
        
      case 'order.deleted':
        setOrders(prev => prev.filter(order => order._id !== orderData._id));
        toast.info(`Order cancelled for Table ${orderData.tableNumber}`);
        break;
    }
  };

  const handleTableUpdate = (message) => {
    const { name: eventType, data: tableData } = message;
    
    switch (eventType) {
      case 'table.created':
        setTables(prev => {
          const existing = prev.find(table => table._id === tableData._id);
          if (existing) return prev;
          return [...prev, tableData];
        });
        break;
        
      case 'table.updated':
        setTables(prev => prev.map(table => 
          table._id === tableData._id ? tableData : table
        ));
        break;
        
      case 'table.deleted':
        setTables(prev => prev.filter(table => table._id !== tableData._id));
        break;
    }
  };

  // Cleanup Ably connection
  useEffect(() => {
    return () => {
      if (orderChannel) {
        orderChannel.unsubscribe();
      }
      if (tableChannel) {
        tableChannel.unsubscribe();
      }
    };
  }, [orderChannel, tableChannel]);

  const fetchData = async () => {
    if (!tenantUserId) return;
    
    try {
      setRefreshing(true);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`/api/order?userId=${encodeURIComponent(tenantUserId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        }),
        fetch(`/api/table?userId=${encodeURIComponent(tenantUserId)}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
      ]);

      console.log('[Waiter] Orders fetch status:', ordersRes.status, 'Tables fetch status:', tablesRes.status);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        if (ordersRes.status === 401) {
          toast.error('Session expired. Please login again.');
          // Handle logout or redirect
        }
        setOrders([]);
      }

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(Array.isArray(tablesData.tables) ? tablesData.tables : []);
      } else {
        if (tablesRes.status === 401) {
          toast.error('Session expired. Please login again.');
        }
        setTables([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      setOrders([]);
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Publish updates so dashboard/waiter sync instantly across clients
        try {
          const updated = await response.json();
          const ch = ably.channels.get(`orders:${tenantUserId}`);
          await ch.publish('order.updated', updated);
          await ch.publish('order-updated', updated);
        } catch (e) {
          console.error('Ably publish failed from waiter:', e);
        }
        toast.success(`Order ${newStatus} successfully`);
        // No need to refresh data, Ably will handle it
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'served': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'preparing': return <FiRefreshCw className="w-4 h-4" />;
      case 'served': return <FiCheck className="w-4 h-4" />;
      case 'completed': return <FiCheck className="w-4 h-4" />;
      case 'cancelled': return <FiAlertCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  // Consider an order paid if any paid flags are true or any payment/bill fields include paid-like statuses
  const isOrderPaid = (o) => {
    const norm = (v) => (v == null ? '' : String(v).toLowerCase().trim());
    const paidBool = o?.billPaid === true || o?.isPaid === true || o?.paid === true;
    const paidStr = ['paid', 'settled', 'billed', 'closed', 'completed'];
    const fields = [o?.paymentStatus, o?.payment_status, o?.billStatus, o?.status];
    const anyPaidKeyword = fields.some(f => paidStr.includes(norm(f)));
    return paidBool || anyPaidKeyword;
  };

   // Professional Compact Order Card Component
   const OrderCard = ({ order }) => {
     const getStatusColor = (status) => {
       switch (status) {
         case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
         case 'preparing': return 'bg-blue-50 border-blue-200 text-blue-800';
         case 'ready': return 'bg-green-50 border-green-200 text-green-800';
         case 'served': return 'bg-purple-50 border-purple-200 text-purple-800';
         default: return 'bg-gray-50 border-gray-200 text-gray-800';
       }
     };

     const getStatusIcon = (status) => {
       switch (status) {
         case 'pending': return <FiClock className="w-4 h-4" />;
         case 'preparing': return <FiRefreshCw className="w-4 h-4" />;
         case 'ready': return <FiCheckCircle className="w-4 h-4" />;
         case 'served': return <FiCheck className="w-4 h-4" />;
         default: return <FiAlertCircle className="w-4 h-4" />;
       }
     };

     const getNextStatus = (currentStatus) => {
       const statusFlow = {
         'pending': 'preparing',
         'preparing': 'ready',
         'ready': 'served',
         'served': 'completed'
       };
       return statusFlow[currentStatus];
     };

     const getActionText = (currentStatus) => {
       const actionText = {
         'pending': 'Start Preparing',
         'preparing': 'Mark Ready',
         'ready': 'Mark Served',
         'served': 'Complete'
       };
       return actionText[currentStatus];
     };

     return (
       <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
         {/* Compact Header */}
         <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
                 #{order._id?.slice(-4) || 'N/A'}
               </div>
               <div className="text-sm font-medium text-gray-900">
                 Table {order.tableNumber || 'N/A'}
               </div>
             </div>
             <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
               {getStatusIcon(order.status)}
               <span className="capitalize">{order.status}</span>
             </div>
           </div>
         </div>

         {/* Compact Items List */}
         <div className="px-4 py-3">
           <div className="space-y-2 max-h-32 overflow-y-auto">
             {order.items?.slice(0, 3).map((item, index) => (
               <div key={index} className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2 flex-1 min-w-0">
                   <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-medium">
                     {item.quantity}x
                   </span>
                   <span className="text-gray-900 truncate font-medium">{item.name}</span>
                 </div>
                 <span className="text-gray-600 text-xs ml-2">₹{item.price}</span>
               </div>
             ))}
             {order.items?.length > 3 && (
               <div className="text-xs text-gray-500 text-center py-1">
                 +{order.items.length - 3} more items
               </div>
             )}
           </div>
         </div>

         {/* Compact Footer with Actions */}
         <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100">
           <div className="flex items-center justify-between">
             <div className="text-sm">
               <div className="font-bold text-gray-900">₹{order.totalAmount}</div>
               <div className="text-xs text-gray-500">
                 {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                   hour: '2-digit', 
                   minute: '2-digit' 
                 })}
               </div>
             </div>
             {order.status !== 'served' && order.status !== 'completed' && (
               <div className="flex gap-2">
                 <button
                   onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                   className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                     order.status === 'pending' 
                       ? 'bg-blue-600 hover:bg-blue-700 text-white'
                       : order.status === 'preparing'
                       ? 'bg-green-600 hover:bg-green-700 text-white'
                       : 'bg-purple-600 hover:bg-purple-700 text-white'
                   }`}
                 >
                   {getActionText(order.status)}
                 </button>
                 {order.status === 'pending' && (
                   <button
                     onClick={() => updateOrderStatus(order._id, 'cancelled')}
                     className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
                   >
                     Cancel
                   </button>
                 )}
               </div>
             )}
           </div>
         </div>
       </div>
     );
   };

  // Professional Compact Table Card Component  
  const TableCard = ({ table }) => {
    const isOccupied = table.status === 'occupied';
    
    return (
      <div className={`rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
        isOccupied 
          ? 'bg-red-50 border-red-200 hover:border-red-300' 
          : 'bg-green-50 border-green-200 hover:border-green-300'
      }`}>
        <div className="p-4 text-center">
          <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
            isOccupied ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <FiUser className={`w-6 h-6 ${isOccupied ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <div className="font-bold text-lg text-gray-900 mb-1">
            Table {table.tableNumber || table.number}
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${
            isOccupied 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isOccupied ? 'Occupied' : 'Available'}
          </div>
        </div>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  const activeOrders = orders.filter(order => !['cancelled'].includes(order.status) && !isOrderPaid(order));
  const pendingOrders = activeOrders.filter(order => order.status === 'pending');
  const preparingOrders = activeOrders.filter(order => order.status === 'preparing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Professional Header */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 mb-6 lg:mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Waiter Dashboard</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-blue-100">Welcome back, <span className="font-semibold text-white">{session?.user?.name || 'User'}</span></span>
                      {hotelName && (
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-3 rounded-full text-white text-xs sm:text-sm font-medium w-fit">
                          {hotelName}
                        </span>
                      )}
                      {tenantUserId && (
                        <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-white text-xs w-fit">
                          ID: {tenantUserId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 sm:px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                  >
                    <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Pending</h3>
                <FiClock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 opacity-80" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{pendingOrders.length}</div>
              <div className="text-yellow-100 text-xs sm:text-sm mt-1">Awaiting prep</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Preparing</h3>
                <FiRefreshCw className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 opacity-80" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{preparingOrders.length}</div>
              <div className="text-blue-100 text-xs sm:text-sm mt-1">In kitchen</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Total</h3>
                <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 opacity-80" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{activeOrders.length}</div>
              <div className="text-green-100 text-xs sm:text-sm mt-1">Active orders</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Tables</h3>
                <FiUser className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 opacity-80" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{Array.isArray(tables) ? tables.length : 0}</div>
              <div className="text-purple-100 text-xs sm:text-sm mt-1">Total tables</div>
            </div>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex px-4 sm:px-6 lg:px-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sm:hidden">Orders ({activeOrders.length})</span>
                  <span className="hidden sm:inline">Orders ({activeOrders.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'tables'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sm:hidden">Tables ({Array.isArray(tables) ? tables.length : 0})</span>
                  <span className="hidden sm:inline">Tables ({Array.isArray(tables) ? tables.length : 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'support'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sm:hidden">Support</span>
                  <span className="hidden sm:inline">Support</span>
                </button>
              </nav>
            </div>

            {activeTab === 'orders' && (
              <div className="p-4 sm:p-6">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FiCheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
                    <p className="text-sm sm:text-base text-gray-500">All orders completed. Great job!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                    {activeOrders
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((order) => (
                        <OrderCard key={order._id} order={order} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tables' && (
              <div className="p-4 sm:p-6">
                {!Array.isArray(tables) || tables.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FiUsers className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
                    <p className="text-sm sm:text-base text-gray-500">Set up tables in admin panel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
                    {tables
                      .filter(table => table && table.number) // Filter out invalid tables
                      .sort((a, b) => (a.number || 0) - (b.number || 0))
                      .map((table) => (
                        <TableCard key={table._id || table.number} table={table} />
                      ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'support' && (
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Support</h2>
                <p className="text-sm text-gray-500 mb-4">Contact us for any issues or concerns.</p>
                <button
                  onClick={() => router.push('/support')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Go to Support Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

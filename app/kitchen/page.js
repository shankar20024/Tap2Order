'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaUtensils, FaClock, FaCheckCircle, FaExclamationTriangle, FaUsers, FaReceipt } from 'react-icons/fa';
import { MdKitchen } from 'react-icons/md';
import ably from '@/lib/ably';

export default function KitchenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preparing'); // 'preparing' or 'ready'
  const [stats, setStats] = useState({
    preparing: 0,
    ready: 0,
    total: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [hotelName, setHotelName] = useState('');

  // Authentication and role check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user is staff with kitchen department access
    if (!session.user.isStaff || session.user.department !== 'kitchen') {
      toast.error('Access denied. Only kitchen staff can access this page.');
      router.push('/login');
      return;
    }

    fetchOrders();
    fetchHotelName();
    setupRealtimeConnection();
  }, [session, status, router]);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/order', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      // Helper function to check if order contains only beverages
      const isOnlyBeverages = (order) => {
        if (!order.items || order.items.length === 0) return false;
        return order.items.every(item => item.subcategory === 'beverages');
      };

      // Filter orders for kitchen (preparing, ready only) but exclude beverages-only orders
      const kitchenOrders = data.filter(order => 
        ['preparing', 'ready'].includes(order.status) && !isOnlyBeverages(order)
      );
      
      setOrders(kitchenOrders);
      updateStats(kitchenOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time connection
  const setupRealtimeConnection = () => {
    if (!session?.user) return;

    // For staff users, use hotelOwner; for regular users, use their ID
    const userId = session.user.isStaff ? session.user.hotelOwner : session.user.id;
    
    if (!userId) {
      setConnectionStatus('error');
      return;
    }

    ably.connection.on('connected', () => {
      setConnectionStatus('connected');
    });

    ably.connection.on('disconnected', () => {
      setConnectionStatus('disconnected');
    });

    ably.connection.on('failed', () => {
      setConnectionStatus('error');
    });

    const channel = ably.channels.get(`orders:${userId}`);
    
    channel.subscribe(['order.created', 'order.updated', 'order-updated'], (message) => {
      const orderData = message.data;
      
      // Helper function to check if order contains only beverages
      const isOnlyBeverages = (order) => {
        if (!order.items || order.items.length === 0) return false;
        return order.items.every(item => item.subcategory === 'beverages');
      };
      
      // Show orders when waiter starts preparing or when marked ready, but exclude beverages-only orders
      if (['preparing', 'ready'].includes(orderData.status) && !isOnlyBeverages(orderData)) {
        setOrders(prevOrders => {
          const existingIndex = prevOrders.findIndex(order => order._id === orderData._id);
          let updatedOrders;
          
          if (existingIndex >= 0) {
            updatedOrders = [...prevOrders];
            updatedOrders[existingIndex] = orderData;
          } else {
            updatedOrders = [orderData, ...prevOrders];
          }
          
          updateStats(updatedOrders);
          return updatedOrders;
        });
        
        // Show notification for new preparing orders
        if (message.name === 'order.updated' && orderData.status === 'preparing') {
          toast.success(`New order started cooking - Table ${orderData.tableNumber}`);
        }
      } else {
        // Remove orders when served, completed, paid, closed, or if it's beverages-only
        setOrders(prevOrders => {
          const filtered = prevOrders.filter(order => order._id !== orderData._id);
          updateStats(filtered);
          return filtered;
        });
        
        // Show notification when order is removed (but not for beverages-only orders)
        if (['served', 'completed', 'paid', 'closed'].includes(orderData.status) && !isOnlyBeverages(orderData)) {
          toast.info(`Order completed - Table ${orderData.tableNumber}`);
        }
      }
    });

  };

  // Fetch hotel name
  const fetchHotelName = async () => {
    try {
      // Get userId from session - use hotelOwner for staff or user id for owner
      const userId = session?.user?.isStaff && session?.user?.hotelOwner 
        ? session.user.hotelOwner 
        : session?.user?.id;

      if (!userId) return;

      const response = await fetch(`/api/me/user?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hotel name');
      }

      const data = await response.json();
      setHotelName(data.hotelName || data.name || 'Kitchen');
    } catch (error) {
      console.error('Error fetching hotel name:', error);
    }
  };

  // Update statistics
  const updateStats = (ordersList) => {
    const stats = {
      preparing: ordersList.filter(order => order.status === 'preparing').length,
      ready: ordersList.filter(order => order.status === 'ready').length,
      total: ordersList.length
    };
    setStats(stats);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter orders by active tab
  const filteredOrders = orders.filter(order => order.status === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdKitchen className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdKitchen className="w-6 h-6 text-orange-500" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{hotelName}</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Chef: {session?.user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="hidden sm:inline">{connectionStatus === 'connected' ? 'Live' : 'Offline'}</span>
              </div>
              
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaUtensils className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.preparing}</p>
              <p className="text-xs text-gray-600">Preparing</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaCheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.ready}</p>
              <p className="text-xs text-gray-600">Ready</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaReceipt className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Mobile-First Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('preparing')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preparing'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <FaUtensils className="w-3 h-3" />
                <span className="hidden sm:inline">Preparing</span>
                <span className="sm:hidden">Prep</span>
                <span className="text-xs">({stats.preparing})</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('ready')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ready'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <FaCheckCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Ready</span>
                <span className="sm:hidden">Done</span>
                <span className="text-xs">({stats.ready})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile-First Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <MdKitchen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {activeTab === 'preparing' ? 'No Orders Being Prepared' : 'No Ready Orders'}
            </h3>
            <p className="text-sm text-gray-600">
              {activeTab === 'preparing' 
                ? 'Orders will appear when waiters start preparing them.'
                : 'Orders will appear when you mark them as ready.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Compact Order Header */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">#{order._id.slice(-6)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <FaUsers className="w-3 h-3" />
                      Table {order.tableNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  {order.customerName && (
                    <p className="text-xs text-gray-600 mt-1 truncate">Customer: {order.customerName}</p>
                  )}
                </div>

                {/* Compact Order Items */}
                <div className="p-3">
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-gray-900 truncate">
                          {item.quantity}x {item.name}
                          {item.size && ` (${item.size})`}
                        </span>
                        <span className="text-gray-600 ml-2">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  {order.specialInstructions && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800 mb-1">Special:</p>
                      <p className="text-xs text-yellow-700 line-clamp-2">{order.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium text-gray-900 text-sm">₹{order.totalAmount}</span>
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'ready')}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <span className="px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Ready to Serve
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

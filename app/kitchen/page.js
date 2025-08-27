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

    // Check if user is staff with kitchen access
    if (!session.user.isStaff) {
      toast.error('Access denied. Only staff can access this page.');
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
      
      // Filter orders for kitchen (preparing, ready only)
      const kitchenOrders = data.filter(order => 
        ['preparing', 'ready'].includes(order.status)
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
      
      // Show orders when waiter starts preparing or when marked ready
      if (['preparing', 'ready'].includes(orderData.status)) {
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
        // Remove orders when served, completed, paid, closed
        setOrders(prevOrders => {
          const filtered = prevOrders.filter(order => order._id !== orderData._id);
          updateStats(filtered);
          return filtered;
        });
        
        // Show notification when order is removed
        if (['served', 'completed', 'paid', 'closed'].includes(orderData.status)) {
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
    const allItems = ordersList.flatMap(order => order.items || []);
    const preparingCount = allItems.filter(item => item.status === 'preparing').length;
    const readyCount = allItems.filter(item => item.status === 'ready').length;

    const stats = {
      preparing: preparingCount,
      ready: readyCount,
      total: preparingCount + readyCount
    };
    setStats(stats);
  };

  // Update individual item status
  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      const response = await fetch(`/api/order/item`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, itemId, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      const result = await response.json();
      
      // Publish real-time update
      try {
        const userId = session.user.isStaff ? session.user.hotelOwner : session.user.id;
        const ch = ably.channels.get(`orders:${userId}`);
        await ch.publish('order.updated', result.order);
        await ch.publish('order-updated', result.order);
      } catch (e) {
        console.error('Ably publish failed from kitchen:', e);
      }

      toast.success(`Item marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  // Get all items from all orders that are in preparing status
  const getAllPreparingItems = () => {
    return orders.flatMap(order => 
      (order.items || [])
        .filter(item => item.status === 'preparing')
        .map(item => ({
          ...item,
          orderId: order._id,
          tableNumber: order.tableNumber,
          orderSpecialRequests: order.specialRequests,
          orderCreatedAt: order.createdAt
        }))
    );
  };

  // Get all items from all orders that are ready
  const getAllReadyItems = () => {
    return orders.flatMap(order => 
      (order.items || [])
        .filter(item => item.status === 'ready')
        .map(item => ({
          ...item,
          orderId: order._id,
          tableNumber: order.tableNumber,
          orderSpecialRequests: order.specialRequests,
          orderCreatedAt: order.createdAt
        }))
    );
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const itemTime = new Date(date);
    const diffMs = now - itemTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return itemTime.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time since order was placed
  const getOrderAge = (createdAt) => {
    if (!createdAt) return '';
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just placed';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <MdKitchen className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  const preparingItems = getAllPreparingItems();
  const readyItems = getAllReadyItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-3 sm:px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <MdKitchen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                  {hotelName}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">
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
                className="px-2 sm:px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="px-3 sm:px-4 md:px-6 py-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaUtensils className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.preparing}</p>
              <p className="text-xs text-gray-600">Preparing</p>
            </div>
          </div>
          
          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mx-auto mb-1" />
              <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.ready}</p>
              <p className="text-xs text-gray-600">Ready</p>
            </div>
          </div>
          
          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border">
            <div className="text-center">
              <FaReceipt className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items to Prepare */}
      <div className="px-3 sm:px-4 md:px-6 pb-4">
        <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          Items to Prepare ({preparingItems.length})
        </h2>
        
        {preparingItems.length === 0 ? (
          <div className="bg-white rounded-lg p-4 sm:p-6 text-center border">
            <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm sm:text-base">No items to prepare</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {preparingItems.map((item, index) => (
              <div key={`${item.orderId}-${item._id}-${index}`} className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Table {item.tableNumber}</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Preparing</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{getOrderAge(item.orderCreatedAt)}</div>
                    {item.preparedAt && (
                      <div className="text-xs text-blue-600">Started: {formatTime(item.preparedAt)}</div>
                    )}
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate flex-1">{item.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 ml-7 sm:ml-8">
                    {item.size && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">{item.size}</span>
                    )}
                  </div>
                </div>
                
                {/* Special Instructions */}
                {(item.notes || item.orderSpecialRequests) && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="text-yellow-800">
                      <span className="font-medium">Instructions: </span>
                      {item.notes && item.orderSpecialRequests 
                        ? `${item.notes} | ${item.orderSpecialRequests}`
                        : item.notes || item.orderSpecialRequests
                      }
                    </p>
                  </div>
                )}
                
                {/* Action Button */}
                <button
                  onClick={() => updateItemStatus(item.orderId, item._id, 'ready')}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors font-medium"
                >
                  Mark Ready
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ready Items */}
      <div className="px-3 sm:px-4 md:px-6 pb-6">
        <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          Ready Items ({readyItems.length})
        </h2>
        
        {readyItems.length === 0 ? (
          <div className="bg-white rounded-lg p-4 sm:p-6 text-center border">
            <FaClock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm sm:text-base">No items ready</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {readyItems.map((item, index) => (
              <div key={`${item.orderId}-${item._id}-${index}`} className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Table {item.tableNumber}</span>
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Ready</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{getOrderAge(item.orderCreatedAt)}</div>
                    {item.readyAt && (
                      <div className="text-xs text-green-600">Ready: {formatTime(item.readyAt)}</div>
                    )}
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                      {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate flex-1">{item.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 ml-7 sm:ml-8">
                    {item.size && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">{item.size}</span>
                    )}
                  </div>
                </div>
                
                {/* Special Instructions */}
                {(item.notes || item.orderSpecialRequests) && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="text-yellow-800">
                      <span className="font-medium">Instructions: </span>
                      {item.notes && item.orderSpecialRequests 
                        ? `${item.notes} | ${item.orderSpecialRequests}`
                        : item.notes || item.orderSpecialRequests
                      }
                    </p>
                  </div>
                )}
                
                {/* Ready Status */}
                <div className="w-full px-3 py-2 bg-green-100 text-green-700 text-xs sm:text-sm rounded-lg font-medium text-center">
                  ✓ Ready for Pickup
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import OrderCard from '../components/waiter/OrderCard';
import ServedOrderCard from '../components/waiter/ServedOrderCard';
import TableCard from '../components/waiter/TableCard';
import { FiClock, FiCheck, FiAlertCircle, FiUsers, FiRefreshCw, FiCheckCircle, FiUser, FiX, FiHelpCircle, FiPlus, FiMinus, FiShoppingCart, FiList } from 'react-icons/fi';
import ably from '@/lib/ably';

// Global ref to persist expanded state across re-renders
let expandedOrdersSet = new Set();

export default function WaiterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orderChannel, setOrderChannel] = useState(null);
  const [tableChannel, setTableChannel] = useState(null);
  const [hotelName, setHotelName] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  
  // Manual order states
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [manualCart, setManualCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Tenant userId resolution
  const tenantUserId = useMemo(() => {
    const base = session?.user?.id;
    const isStaff = session?.user?.role === 'staff' || session?.user?.role === 'waiter' || session?.user?.role === 'kitchen' || session?.user?.role === 'manager';
    const normalize = (val) => {
      if (!val) return undefined;
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val.$oid) return String(val.$oid);
      try { return String(val); } catch { return undefined; }
    };
    
    if (isStaff) {
      // For staff users, get hotelOwner from session (set during staff login)
      const fromSession = normalize(session?.user?.hotelOwner);
      if (fromSession) {
        return fromSession;
      }
      
      // Fallback to localStorage for staff
      if (typeof window === 'undefined') return undefined;
      const fromStorage = normalize(localStorage.getItem('selectedHotelUserId'));
      return fromStorage || undefined;
    }
    
    // For owners/admins, use their own ID
    return normalize(base);
  }, [session?.user?.id, session?.user?.role, session?.user?.hotelOwner]);

  const filteredMenuItems = useMemo(() => {
    if (!Array.isArray(menuItems)) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = menuItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(lowerCaseQuery);
      const descriptionMatch = item.description && item.description.toLowerCase().includes(lowerCaseQuery);
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      return (nameMatch || descriptionMatch) && categoryMatch;
    });
    return filtered;
  }, [searchQuery, selectedCategory, menuItems]);

  const menuCategories = useMemo(() => {
    if (!Array.isArray(menuItems)) return ['all'];

    // Robustly clean and collect unique categories
    const categories = new Set(
      menuItems
        .map(item => item.category) // Get all categories
        .filter(cat => typeof cat === 'string' && cat.trim() !== '') // Ensure it's a non-empty string
        .map(cat => cat.trim()) // Trim whitespace
        .filter(cat => cat.toLowerCase() !== 'all') // Exclude any 'all' variants from data
    );

    return ['all', ...Array.from(categories)];
  }, [menuItems]);

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
      } else {
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const storedName = localStorage.getItem('selectedHotelName');
          setHotelName(storedName || 'Unknown Hotel');
        }
      }
    } catch (error) {
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
    if (!tenantUserId) {
      return;
    }
    fetchHotelOwnerName(tenantUserId);
    initializeAbly();
    fetchData();
    return () => {
      try {
        orderChannel?.unsubscribe?.();
        tableChannel?.unsubscribe?.();
      } catch {}
    };
  }, [tenantUserId]);

  const initializeAbly = async () => {
    try {
      const ablyInstance = ably;
      if (ablyInstance.connection?.state !== 'connected') {
        ablyInstance.connection.connect();
      }
      
      ablyInstance.connection.on('connected', () => {
        setIsConnected(true);
        toast.success('Connected to real-time updates');
      });

      ablyInstance.connection.on('disconnected', () => {
        setIsConnected(false);
        toast.error('Disconnected from real-time updates');
      });

      ablyInstance.connection.on('failed', () => {
        setIsConnected(false);
        toast.error('Failed to connect to real-time updates');
      });

      // Subscribe to order updates (use tenantUserId)
      const channelName = `orders:${tenantUserId}`;
      const orderCh = ablyInstance.channels.get(channelName);
      
      orderCh.subscribe(['order.created', 'order.updated', 'order-updated', 'order.deleted'], (message) => {
        const eventType = message.name;
        const orderData = message.data;
        
        if (eventType === 'order.created') {
          fetchData(); // Immediate refresh like refresh button
        } else if (eventType === 'order.updated') {
          fetchData(); // Immediate refresh like refresh button
        } else if (eventType === 'order.deleted') {
          fetchData(); // Immediate refresh like refresh button
        }
      });
      
      // Subscribe to new-order events from QR menu
      orderCh.subscribe('new-order', (message) => {
        fetchData(); // Immediate refresh like refresh button
      });
      
      setOrderChannel(orderCh);

      // Subscribe to table updates (use tenantUserId)
      const tableCh = ablyInstance.channels.get(`tables:${tenantUserId}`);
      tableCh.subscribe(['table.created', 'table.updated', 'table.deleted'], (message) => {
        handleTableUpdate(message);
      });
      setTableChannel(tableCh);
    } catch (error) {
      toast.error('Failed to initialize real-time connection');
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    // Remove duplicate subscription - use only the main one with tenantUserId
  }, [session?.user?.id]);

  const handleTableUpdate = (message) => {
    const { name: eventType, data: tableData } = message;
    fetchTables();
  };

  const fetchData = async () => {
    if (!tenantUserId) return;
    
    try {
      setRefreshing(true);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
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
        }),
        fetch(`/api/menu?userId=${encodeURIComponent(tenantUserId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        })
      ]);

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

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(Array.isArray(menuData) ? menuData : []);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      setOrders([]);
      setTables([]);
      setMenuItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual order functions
  const addToManualCart = (item, size = null) => {
    const existingItem = manualCart.find(cartItem => 
      cartItem.id === item._id && cartItem.size === (size || (item.pricing && item.pricing.length > 0 ? item.pricing[0].size : ''))
    );
    
    if (existingItem) {
      setManualCart(prev => prev.map(cartItem =>
        cartItem.id === item._id && cartItem.size === (size || (item.pricing && item.pricing.length > 0 ? item.pricing[0].size : ''))
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setManualCart(prev => [...prev, {
        id: item._id,
        name: item.name,
        size: size || (item.pricing && item.pricing.length > 0 ? item.pricing[0].size : ''),
        price: size ? item.pricing.find(p => p.size === size)?.price || item.price : (item.pricing && item.pricing.length > 0 ? item.pricing[0].price : item.price),
        quantity: 1,
        category: item.category,
        unit: item.unit,
      }]);
    }
  };

  const updateManualCartQuantity = (itemId, size, newQuantity) => {
    if (newQuantity <= 0) {
      setManualCart(prev => prev.filter(item => !(item.id === itemId && item.size === size)));
    } else {
      setManualCart(prev => prev.map(item => 
        item.id === itemId && item.size === size 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getManualCartTotal = () => {
    return manualCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const createManualOrder = async () => {
    if (!selectedTable || manualCart.length === 0) {
      toast.error('Please select a table and add items to cart');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    setCreatingOrder(true);

    try {
      const orderData = {
        tableNumber: parseInt(selectedTable),
        cart: manualCart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          category: item.category,
          notes: ''
        })),
        orderMessage: specialInstructions.trim(),
        status: 'pending',
        userId: tenantUserId,
        customerInfo: {
          name: customerName,
          phone: customerPhone
        }
      };

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        
        // Publish to Ably for real-time updates
        try {
          const ch = ably.channels.get(`orders:${tenantUserId}`);
          await ch.publish('order.created', newOrder);
        } catch (e) {
          // Ably publish failed
        }

        toast.success('Manual order created successfully!');
        
        // Reset form
        setSelectedTable('');
        setManualCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSpecialInstructions('');
        setShowManualOrderForm(false);
        
        // Switch to orders tab to show the new order
        setActiveTab('orders');
        
        // Refresh orders
        fetchData();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      toast.error('Failed to create manual order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/order/bulk-item-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        // Publish updates so dashboard/waiter sync instantly across clients
        try {
          const updated = await response.json();
          const ch = ably.channels.get(`orders:${tenantUserId}`);
          await ch.publish('order.updated', updated.order);
          await ch.publish('order-updated', updated.order);
        } catch (e) {
          // Ably publish failed from waiter
        }
        toast.success('Order started preparing');
        // No need to refresh data, Ably will handle it
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast.error('Failed to start preparing order');
    }
  };

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/order/item`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, itemId, status: newStatus }),
      });

      if (response.ok) {
        // Publish updates so dashboard/waiter sync instantly across clients
        try {
          const updated = await response.json();
          const ch = ably.channels.get(`orders:${tenantUserId}`);
          await ch.publish('order.updated', updated.order);
          await ch.publish('order-updated', updated.order);
        } catch (e) {
          // Ably publish failed from waiter
        }
        toast.success(`Item marked as ${newStatus}`);
        // No need to refresh data, Ably will handle it
      } else {
        throw new Error('Failed to update item status');
      }
    } catch (error) {
      toast.error('Failed to update item status');
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

  // Helper function to check if order contains only beverages
  const isOnlyBeverages = (order) => {
    if (!order.items || order.items.length === 0) return false;
    
    // Check both category and subcategory for backward compatibility
    const result = order.items.every(item => 
      item.category === 'beverages' || item.subcategory === 'beverages'
    );
    
    return result;
  };

  // Ultra Responsive Order Card Component
  const OrderCard = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(expandedOrdersSet.has(order._id));
    const items = order.items || [];
    const maxVisibleItems = 2; // Reduced for mobile
    const hasMoreItems = items.length > maxVisibleItems;
    const visibleItems = isExpanded ? items : items.slice(0, maxVisibleItems);
    const onlyBeverages = isOnlyBeverages(order);

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        case 'preparing': return 'bg-blue-50 border-blue-200 text-blue-800';
        case 'ready': return 'bg-green-50 border-green-200 text-green-800';
        case 'served': return 'bg-purple-50 border-purple-200 text-purple-800';
        case 'cancelled': return 'bg-red-50 border-red-200 text-red-800';
        default: return 'bg-gray-50 border-gray-200 text-gray-800';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return <FiClock className="w-3 h-3 sm:w-4 sm:h-4" />;
        case 'preparing': return <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
        case 'ready': return <FiCheck className="w-3 h-3 sm:w-4 sm:h-4" />;
        case 'served': return <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
        case 'cancelled': return <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
        default: return <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      }
    };

    const getNextStatus = (order) => {
      
      // For beverages orders: only served -> completed (no preparing/ready stages)
      if (onlyBeverages && order.status === 'served') {
        return 'completed';
      }
      
      // For regular food orders: pending -> preparing -> ready -> served -> completed
      switch (order.status) {
        case 'pending': return 'preparing';
        case 'preparing': return 'ready';
        case 'ready': return 'served';
        case 'served': return 'completed';
        default: return order.status;
      }
    };

    const getActionText = (order) => {
      
      // For beverages orders: only Mark Served and Complete Order buttons
      if (onlyBeverages) {
        switch (order.status) {
          case 'pending': return 'Mark Served';
          case 'served': return 'Complete Order';
          default: return 'Update Status';
        }
      }
      
      // For regular food orders
      switch (order.status) {
        case 'pending': return 'Start Preparing';
        case 'preparing': return 'Mark Ready';
        case 'ready': return 'Mark Served';
        case 'served': return 'Complete Order';
        default: return 'Update Status';
      }
    };

    const handleToggleExpanded = () => {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      
      if (newExpanded) {
        expandedOrdersSet.add(order._id);
      } else {
        expandedOrdersSet.delete(order._id);
      }
    };

    return (
      <div className={`bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:scale-[1.02] ${
        onlyBeverages ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Ultra Responsive Header */}
        <div className="px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border-b border-gray-100">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">
                #{order._id?.slice(-6) || 'N/A'}
              </span>
              {onlyBeverages && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-100 text-blue-700 text-xs sm:text-xs lg:text-sm rounded-full font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Beverages Only</span>
                  <span className="sm:hidden">🥤</span>
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-medium ${getStatusColor(order.status)} min-h-[28px] sm:min-h-[32px]`}>
              {getStatusIcon(order.status)}
              <span className="capitalize hidden xs:inline">{order.status}</span>
              <span className="capitalize xs:hidden">{order.status.slice(0,4)}</span>
            </div>
          </div>
          
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <FiUser className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="font-medium">Table {order.tableNumber}</span>
            </div>
            {order.customerInfo?.name && (
              <div className="flex items-center gap-1 truncate">
                <span className="text-gray-500 hidden sm:inline">•</span>
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{order.customerInfo?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Simple Items List */}
        <div className="px-3 sm:px-4 lg:px-5 py-2">
          <div className="space-y-1">
            {visibleItems.map((item, index) => (
              <div key={item._id || index} className="flex items-center justify-between py-1.5 text-xs border-b border-gray-100 last:border-b-0 min-h-[28px]">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
                    {item.quantity}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-gray-900 truncate max-w-[120px] sm:max-w-[160px] lg:max-w-[200px]" title={item.name}>
                      {item.name}
                    </span>
                    {item.size && (
                      <span className="text-gray-500 text-xs flex-shrink-0">({item.size})</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-gray-600 font-medium text-xs whitespace-nowrap">₹{(item.price * item.quantity)}</span>
                  
                  <span className={`px-1.5 py-0.5 text-xs rounded whitespace-nowrap ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'ready' ? 'bg-green-100 text-green-700' :
                    item.status === 'served' ? 'bg-purple-100 text-purple-700' :
                    item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status || 'pending'}
                  </span>
                  
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      {item.category === 'beverages' || item.subcategory === 'beverages' ? (
                        <>
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'served')}
                            className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded whitespace-nowrap hover:bg-purple-700 transition-colors"
                          >
                            Mark Served
                          </button>
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'cancelled')}
                            className="px-2 py-0.5 bg-red-600 text-white text-xs rounded whitespace-nowrap hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'preparing')}
                            className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded whitespace-nowrap hover:bg-blue-700 transition-colors"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'cancelled')}
                            className="px-2 py-0.5 bg-red-600 text-white text-xs rounded whitespace-nowrap hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {item.status === 'preparing' && (
                    <button
                      onClick={() => updateItemStatus(order._id, item._id, 'ready')}
                      className="px-2 py-0.5 bg-green-600 text-white text-xs rounded whitespace-nowrap hover:bg-green-700 transition-colors"
                    >
                      Ready
                    </button>
                  )}
                  {item.status === 'ready' && (
                    <button
                      onClick={() => updateItemStatus(order._id, item._id, 'served')}
                      className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded whitespace-nowrap hover:bg-purple-700 transition-colors"
                    >
                      Serve
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {hasMoreItems && (
              <button
                onClick={handleToggleExpanded}
                className="w-full text-center text-xs text-blue-600 py-1 hover:bg-blue-50 transition-colors"
              >
                {isExpanded ? 'Show less' : `+${items.length - maxVisibleItems} more items`}
              </button>
            )}
          </div>
        </div>

        {/* Ultra Responsive Footer */}
        <div className="px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 border-t border-gray-100">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center justify-between xs:justify-start xs:flex-col xs:items-start gap-2 xs:gap-0">
              {/* <div className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl">
                ₹{order.totalAmount || (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)}
              </div> */}
              <div className="text-xs sm:text-sm text-gray-500">
                {(() => {
                  const timeToShow = order.createdAt || order.timestamp;
                  
                  if (!timeToShow) {
                    return 'No time';
                  }
                  
                  try {
                    const date = new Date(timeToShow);
                    if (isNaN(date.getTime())) {
                      return 'Invalid time';
                    }
                    return date.toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  } catch (e) {
                    return 'Time error';
                  }
                })()}
              </div>
            </div>
            
            {/* Action Button - Ultra Touch Friendly */}
            {order.status === 'pending' && !onlyBeverages && (
              <button
                onClick={() => updateOrderStatus(order._id, getNextStatus(order))}
                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm lg:text-base min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] bg-yellow-600 hover:bg-yellow-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                <span className="hidden sm:inline">Start Preparing</span>
                <span className="sm:hidden"> Start</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const activeOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(order => {
      if (!order.items || order.items.length === 0) return false;
      // An order is active if it has at least one item that is not served or cancelled.
      const hasActiveItems = order.items.some(item => 
        item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
      );
      return hasActiveItems && !isOrderPaid(order);
    });
  }, [orders]);

  const servedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(order => {
      if (!order.items || order.items.length === 0) return false;
      // An order is considered for the served tab if it has at least ONE item that is served.
      const hasServedItems = order.items.some(item => item.status === 'served');
      return hasServedItems && !isOrderPaid(order);
    });
  }, [orders]);

  const pendingItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => item.status === 'pending').length || 0);
  }, 0);

  const preparingItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => item.status === 'preparing').length || 0);
  }, 0);

  const activeItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => 
      ['pending', 'preparing', 'ready'].includes(item.status)
    ).length || 0);
  }, 0);

  const servedItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => 
      ['served', 'completed'].includes(item.status)
    ).length || 0);
  }, 0);

  const readyItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => item.status === 'ready').length || 0);
  }, 0);

  const actualServedItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => item.status === 'served').length || 0);
  }, 0);

  const totalItemsCount = orders.reduce((total, order) => {
    return total + (order.items?.filter(item => item.status !== 'cancelled').length || 0);
  }, 0);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());
  const [expandedServedOrderIds, setExpandedServedOrderIds] = useState(new Set());

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleServedOrderExpand = (orderId) => {
    setExpandedServedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v2m6-2a2 2 0 100-4m0 4a2 2 0 110 4m0-4a2 2 0 100-4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Waiter Dashboard</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-blue-100">Welcome back, <span className="font-semibold text-white">{session?.user?.name || 'User'}</span></span>
                      {hotelName && (
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-3 rounded-full text-white text-xs sm:text-sm font-medium w-fit">
                          {hotelName}cance
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

          {/* Compact Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-3 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium">Total Items</h3>
                <FiList className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-lg font-bold">{totalItemsCount}</div>
              <div className="text-indigo-100 text-xs">All items</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-3 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium">Pending</h3>
                <FiClock className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-lg font-bold">{pendingItemsCount}</div>
              <div className="text-yellow-100 text-xs">Awaiting prep</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-3 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium">Preparing</h3>
                <FiRefreshCw className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-lg font-bold">{preparingItemsCount}</div>
              <div className="text-blue-100 text-xs">In kitchen</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium">Ready</h3>
                <FiCheck className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-lg font-bold">{readyItemsCount}</div>
              <div className="text-green-100 text-xs">Ready to serve</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-3 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium">Served</h3>
                <FiCheckCircle className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-lg font-bold">{actualServedItemsCount}</div>
              <div className="text-purple-100 text-xs">Served to customers</div>
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
                  <span className="sm:hidden">Orders ({activeItemsCount})</span>
                  <span className="hidden sm:inline">Orders ({activeItemsCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('served-orders')}
                  className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'served-orders'
                      ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sm:hidden">Served Orders ({servedItemsCount})</span>
                  <span className="hidden sm:inline">Served Orders ({servedItemsCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('manual-order')}
                  className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'manual-order'
                      ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="sm:hidden">Manual Order</span>
                  <span className="hidden sm:inline">Manual Order</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-cols-max">
                    {activeOrders
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((order) => (
                        <div key={order._id} className="w-full min-w-0">
                          <OrderCard 
                            order={order} 
                            expandedOrderId={expandedOrderIds.has(order._id) ? order._id : null}
                            toggleExpand={toggleOrderExpand}
                            handleUpdateItemStatus={updateItemStatus}
                            handlePrintOrder={() => {}}
                            handleEditOrder={() => {}}
                            handleCancelOrder={() => {}}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'served-orders' && (
              <div className="p-4 sm:p-6">
                {servedOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FiUsers className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Served Orders</h3>
                    <p className="text-sm sm:text-base text-gray-500">No orders have been served yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                    {servedOrders
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((order) => (
                        <ServedOrderCard 
                          key={order._id} 
                          order={order} 
                          expandedOrderId={expandedServedOrderIds.has(order._id) ? order._id : null}
                          toggleExpand={toggleServedOrderExpand}
                          tabType="served"
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'manual-order' && (
              <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 mb-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <FiShoppingCart className="w-6 h-6" />
                      <h2 className="text-xl font-bold">Create Manual Order</h2>
                    </div>
                    <p className="text-green-100">Take orders on behalf of customers who need assistance</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Form */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Customer & Table Info */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Table Number *
                            </label>
                            <select
                              value={selectedTable}
                              onChange={(e) => setSelectedTable(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="">Select Table</option>
                              {tables.map((table) => (
                                <option key={table._id} value={table.number || table.tableNumber}>
                                  Table {table.number || table.tableNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Customer Name (Optional)
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Walk-in Customer"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Customer Phone (Optional)
                            </label>
                            <input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Enter phone number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Instructions (Optional)
                          </label>
                          <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests or notes..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h3>
                        <div className="space-y-3 mb-6">
                          <div className="relative">
                            <input
                              type="search"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search menu items..."
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                            <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {menuCategories.map((category) => {
                              const itemCount = category === 'all' 
                                ? menuItems.length 
                                : menuItems.filter(item => item.category === category).length;
                              
                              if (itemCount === 0 && category !== 'all') return null;

                              return (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                    selectedCategory === category
                                      ? 'bg-green-600 text-white shadow-md'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <span className="capitalize">{category}</span> ({itemCount})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm text-gray-600">
                            {filteredMenuItems.length} item{filteredMenuItems.length !== 1 ? 's' : ''} found
                          </p>
                          {(searchQuery || selectedCategory !== 'all') && (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                              }}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {filteredMenuItems.map((item) => (
                            <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      item.category === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.category}
                                    </span>
                                    {item.spicyLevel && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                        {item.spicyLevel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                              )}

                              {/* Pricing Options */}
                              {item.pricing && item.pricing.length > 0 ? (
                                <div className="space-y-2">
                                  {item.pricing.map((priceOption) => (
                                    <div key={priceOption.size} className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm font-medium">{priceOption.size}</span>
                                        {priceOption.description && (
                                          <span className="text-xs text-gray-500 ml-1">({priceOption.description})</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-green-600">₹{priceOption.price}</span>
                                        <button
                                          onClick={() => addToManualCart(item, priceOption.size)}
                                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                        >
                                          <FiPlus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-green-600">₹{item.price}</span>
                                  <button
                                    onClick={() => addToManualCart(item)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    <FiPlus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cart */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Order Cart</h3>
                          {manualCart.length > 0 && (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                              {manualCart.length} item{manualCart.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {manualCart.length === 0 ? (
                          <div className="text-center py-8">
                            <FiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No items added</p>
                            <p className="text-gray-400 text-xs mt-1">Search and add items from menu</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                              {manualCart.map((item, index) => (
                                <div key={`${item.id}-${item.size}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                    {item.size && (
                                      <p className="text-xs text-blue-600 font-medium">{item.size}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-bold text-green-600">₹{item.price}</span>
                                      <span className="text-xs text-gray-500">× {item.quantity}</span>
                                      <span className="text-xs font-medium text-gray-700">= ₹{item.price * item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => updateManualCartQuantity(item.id, item.size, item.quantity - 1)}
                                      className="bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded-md transition-colors"
                                      title="Decrease quantity"
                                    >
                                      <FiMinus className="w-3 h-3" />
                                    </button>
                                    <span className="font-medium text-sm w-8 text-center bg-white px-2 py-1 rounded border">{item.quantity}</span>
                                    <button
                                      onClick={() => updateManualCartQuantity(item.id, item.size, item.quantity + 1)}
                                      className="bg-green-100 hover:bg-green-200 text-green-600 p-1 rounded-md transition-colors"
                                      title="Increase quantity"
                                    >
                                      <FiPlus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="border-t pt-4 mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                  Subtotal:
                                </span>
                                <span className="text-sm font-medium text-gray-900">₹{getManualCartTotal()}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <button
                                onClick={createManualOrder}
                                disabled={!selectedTable || manualCart.length === 0 || creatingOrder}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                {creatingOrder ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating Order...
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="w-4 h-4" />
                                    Create Order (₹{getManualCartTotal()})
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setManualCart([]);
                                  setSearchQuery('');
                                  setSelectedCategory('all');
                                }}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <FiX className="w-4 h-4" />
                                Clear Cart
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import ServedOrderCard from '../components/waiter/ServedOrderCard';
import TableCard from '../components/waiter/TableCard';
import SectionSidebar from '../components/qr/CategorySidebar';
import MenuCard from '../components/qr/MenuCard';
import BottomCart from '../components/qr/BottomCart';
import CartPanel from '../components/qr/CartPanel';
import { FiClock, FiCheck, FiAlertCircle, FiUsers, FiRefreshCw, FiCheckCircle, FiUser, FiX, FiHelpCircle, FiPlus, FiMinus, FiShoppingCart, FiList, FiSearch, FiFilter, FiGrid, FiMenu, FiHome, FiSettings } from 'react-icons/fi';
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
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState('All');

  // Manual order states
  const [selectedTable, setSelectedTable] = useState('');
  const [manualCart, setManualCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gstConfig, setGstConfig] = useState({ hasGstNumber: false, taxRate: 0, gstNumber: '' });
  const [tableError, setTableError] = useState('');
  
  // Menu card states
  const [itemQuantities, setItemQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  
  // Cart panel states
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

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
    let filtered = menuItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(lowerCaseQuery);
      const descriptionMatch = item.description && item.description.toLowerCase().includes(lowerCaseQuery);
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      return (nameMatch || descriptionMatch) && categoryMatch;
    });

    // Filter by section if not 'All'
    if (activeSection !== 'All') {
      filtered = filtered.filter(item => item.section === activeSection);
    }

    return filtered;
  }, [searchQuery, selectedCategory, menuItems, activeSection]);

  const menuCategories = useMemo(() => {
    if (!Array.isArray(menuItems)) return ['all'];

    // Fixed dietary filters - only show veg, non-veg, jain if they exist in menu
    const availableFilters = ['all'];
    
    // Check which dietary categories are available in menu items
    const hasVeg = menuItems.some(item => item.category === 'veg');
    const hasNonVeg = menuItems.some(item => item.category === 'non-veg');
    const hasJain = menuItems.some(item => item.category === 'jain');
    
    if (hasVeg) availableFilters.push('veg');
    if (hasNonVeg) availableFilters.push('non-veg');
    if (hasJain) availableFilters.push('jain');

    return availableFilters;
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
    if (status === 'loading') return; // Wait for session to load
    
    if (status === 'unauthenticated') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }
    }
    
    // Set loading to false when authentication is resolved
    if (status === 'authenticated' || (status === 'unauthenticated' && localStorage.getItem('authToken'))) {
      setLoading(false);
    }
  }, [status, router]);

  // If staff and no tenantUserId (not selected), force re-select
  useEffect(() => {
    if (session?.user?.role === 'staff' && !tenantUserId) {
      toast.error('Please select a hotel to continue');
      router.push('/login');
    }
  }, [session?.user?.role, tenantUserId, router]);

  // Load cached tables from localStorage
  const loadCachedTables = () => {
    if (!tenantUserId) return;
    
    try {
      const cachedTablesKey = `tables_${tenantUserId}`;
      const cachedTables = localStorage.getItem(cachedTablesKey);
      
      if (cachedTables) {
        const tableArray = JSON.parse(cachedTables);
                setTables(tableArray);
      }
    } catch (error) {
          }
  };

  // Initialize Ably and fetch initial data on tenant change
  useEffect(() => {
    if (!tenantUserId) {
      return;
    }
    
    // Load cached tables first for immediate validation
    loadCachedTables();
    
    fetchHotelOwnerName(tenantUserId);
    fetchGstConfig();
    initializeAbly();
    
    // Fetch all data on initial load
    fetchOrdersOnly();
    fetchTablesOnly();
    fetchMenuAndSections(); // Only fetch menu/sections on initial load
    
    return () => {
      try {
        orderChannel?.unsubscribe?.();
        tableChannel?.unsubscribe?.();
      } catch { }
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
          fetchOrdersOnly(); // Only fetch orders, not all data
        } else if (eventType === 'order.updated') {
          fetchOrdersOnly(); // Only fetch orders, not all data
        } else if (eventType === 'order.deleted') {
          fetchOrdersOnly(); // Only fetch orders, not all data
        }
      });

      // Subscribe to new-order events from QR menu
      orderCh.subscribe('new-order', (message) => {
        fetchOrdersOnly(); // Only fetch orders, not all data
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
    fetchTablesOnly();
  };

  // Fetch only orders to avoid duplicate API calls
  const fetchOrdersOnly = async () => {
    if (!tenantUserId) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/order?userId=${encodeURIComponent(tenantUserId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
        }
        setOrders([]);
      }
    } catch (error) {
            setOrders([]);
    }
  };

  // Fetch only tables to avoid duplicate API calls
  const fetchTablesOnly = async () => {
    if (!tenantUserId) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/table?userId=${encodeURIComponent(tenantUserId)}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (response.ok) {
        const tablesData = await response.json();
        const tableArray = Array.isArray(tablesData.tables) ? tablesData.tables : [];
        
        // Cache tables in localStorage for validation
        const cachedTablesKey = `tables_${tenantUserId}`;
        try {
          localStorage.setItem(cachedTablesKey, JSON.stringify(tableArray));
        } catch (error) {
                  }
        
        setTables(tableArray);
      } else {
                setTables([]);
      }
    } catch (error) {
            setTables([]);
    }
  };

  // Fetch menu and sections only when needed (rarely changes)
  const fetchMenuAndSections = async () => {
    if (!tenantUserId) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      const [menuRes, sectionsRes] = await Promise.all([
        fetch(`/api/menu?userId=${encodeURIComponent(tenantUserId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        }),
        fetch(`/api/sections`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        })
      ]);

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(Array.isArray(menuData) ? menuData : []);
      } else {
        setMenuItems([]);
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        // API returns { sections: [...] }, not direct array
        setSections(Array.isArray(sectionsData.sections) ? sectionsData.sections : []);
      } else {
        setSections([]);
      }
    } catch (error) {
            setMenuItems([]);
      setSections([]);
    }
  };

  // Manual refresh - fetch all data (used by refresh button)
  const fetchData = async () => {
    if (!tenantUserId) return;

    try {
      setRefreshing(true);

      // Fetch all data for manual refresh
      await Promise.all([
        fetchOrdersOnly(),
        fetchTablesOnly(),
        fetchMenuAndSections()
      ]);
    } catch (error) {
            toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch GST configuration from business-info
  const fetchGstConfig = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`/api/business/info?userId=${encodeURIComponent(tenantUserId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (response.ok) {
        const businessData = await response.json();
        // Extract GST config from business info
        const gstConfig = {
          hasGstNumber: businessData.gstDetails?.hasGstNumber || false,
          taxRate: businessData.gstDetails?.taxRate || 0,
          gstNumber: businessData.gstDetails?.gstNumber || ''
        };
        setGstConfig(gstConfig);
        setBusinessInfo(businessData);
      }
    } catch (error) {
      // GST config fetch failed, use defaults
          }
  };

  // Calculate GST breakdown
  const getGSTBreakdown = (subtotal) => {
    if (!gstConfig.hasGstNumber || gstConfig.taxRate <= 0) {
      return {
        subtotal,
        cgstAmount: 0,
        sgstAmount: 0,
        totalGst: 0,
        grandTotal: subtotal,
        taxRate: 0,
        isGstApplicable: false
      };
    }

    const totalTax = subtotal * (gstConfig.taxRate / 100);
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;
    const grandTotal = subtotal + totalTax;

    return {
      subtotal,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      totalGst: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      taxRate: gstConfig.taxRate,
      isGstApplicable: true
    };
  };

  // Validate table existence using cached data
  const validateTable = (tableNumber) => {
    if (!tableNumber || !tenantUserId) {
      setTableError('');
      return false;
    }

    try {
      // Get cached tables from localStorage
      const cachedTablesKey = `tables_${tenantUserId}`;
      const cachedTables = localStorage.getItem(cachedTablesKey);
      
      if (!cachedTables) {
        setTableError('Tables data not loaded. Please refresh the page.');
        return false;
      }

      const tables = JSON.parse(cachedTables);
      const tableExists = tables.some(table =>
        (table.number && table.number.toString() === tableNumber.toString()) ||
        (table.tableNumber && table.tableNumber.toString() === tableNumber.toString())
      );

      if (!tableExists) {
        setTableError(`Table ${tableNumber} does not exist`);
        return false;
      } else {
        setTableError('');
        return true;
      }
    } catch (error) {
      setTableError('Error validating table');
      return false;
    }
  };

  // Handle table input change
  const handleTableChange = (value) => {
    setSelectedTable(value);
    if (value) {
      // Immediate validation using cached data
      validateTable(value);
    } else {
      setTableError('');
    }
  };

  // MenuCard helper functions
  const getPriceForSize = (item, sizeIndex = 0) => {
    if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 0) {
      return item.pricing[sizeIndex]?.price || item.pricing[0].price;
    }
    return item.price || 0;
  };

  const handleSizeSelect = (itemId, sizeIndex) => {
    setSelectedSizes(prev => ({
      ...prev,
      [itemId]: sizeIndex
    }));
  };

  const handleQuantityIncrement = (itemId) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleQuantityDecrement = (itemId) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = itemQuantities[item._id] || 0;
    const sizeIndex = selectedSizes[item._id] || 0;
    
    if (quantity > 0) {
      const size = item.pricing && item.pricing.length > 0 ? item.pricing[sizeIndex]?.size : '';
      const price = getPriceForSize(item, sizeIndex);
      
      // Add to manual cart multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        addToManualCart(item, size);
      }
      
      // Reset quantity after adding to cart
      setItemQuantities(prev => ({
        ...prev,
        [item._id]: 0
      }));
      
      toast.success(`Added ${quantity} ${item.name} to cart`);
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
      const price = size ?
        item.pricing.find(p => p.size === size)?.price || item.price :
        item.price;

      setManualCart(prev => [...prev, {
        id: item._id,
        name: item.name,
        price: price,
        quantity: 1,
        size: size || (item.pricing && item.pricing.length > 0 ? item.pricing[0].size : ''),
        category: item.category,
        subcategory: item.subcategory || 'main-course'
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

  // Cart handler functions for new components
  const handleCartQuantityDecrease = (menuItemId) => {
    const cartItem = manualCart.find(item => item.id === menuItemId);
    if (cartItem) {
      updateManualCartQuantity(cartItem.id, cartItem.size, cartItem.quantity - 1);
    }
  };

  const handleCartQuantityIncrease = (menuItemId) => {
    const cartItem = manualCart.find(item => item.id === menuItemId);
    if (cartItem) {
      updateManualCartQuantity(cartItem.id, cartItem.size, cartItem.quantity + 1);
    }
  };

  const handleCartItemRemove = (menuItemId) => {
    setManualCart(prev => prev.filter(item => item.id !== menuItemId));
  };

  const handleViewCart = () => {
    setIsCartPanelOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartPanelOpen(false);
  };

  const handleClearCart = () => {
    setManualCart([]);
    setSelectedTable('');
    setCustomerName('');
    setCustomerPhone('');
    setSpecialInstructions('');
    setOrderMessage('');
  };

  const getTotalPrice = () => {
    return manualCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Transform cart data for new components
  const transformedCartItems = manualCart.map(item => ({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size
  }));

  const getManualCartTotal = () => {
    return manualCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getManualCartGSTBreakdown = () => {
    const subtotal = getManualCartTotal();
    return getGSTBreakdown(subtotal);
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
      // Get client IP address
      let clientIP = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIP = ipData.ip;
      } catch (ipError) {
        // IP fetch failed, continue without IP
      }

      // Create/update customer record first
      let customerId = null;

      if (customerName && customerPhone) {
        try {
          const customerPayload = {
            name: customerName,
            phone: customerPhone,
            userId: tenantUserId,
            tableNumber: parseInt(selectedTable),
            ip: clientIP
          };

          const customerResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerPayload),
          });

          if (customerResponse.ok) {
            const customerResult = await customerResponse.json();
            customerId = customerResult.customer._id;
          }
        } catch (customerError) {
          // Customer creation failed, continue without customer ID
        }
      }

      // Calculate GST details
      const gstBreakdown = getManualCartGSTBreakdown();
      const totalAmount = gstBreakdown.grandTotal;

      const orderData = {
        tableNumber: parseInt(selectedTable),
        cart: manualCart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size || '',
          category: item.category || 'veg',
          subcategory: item.subcategory || 'main-course',
          notes: ''
        })),
        orderMessage: specialInstructions.trim(),
        status: 'pending',
        userId: tenantUserId,
        customerId,
        customerInfo: {
          name: customerName,
          phone: customerPhone || '',
          ip: clientIP
        },
        totalAmount: totalAmount,
        gstDetails: gstBreakdown,
        orderType: 'dine-in'
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
        const result = await response.json();

        // Update customer stats if customer was created
        if (customerId && result.order) {
          try {
            await fetch(`/api/customers/${customerId}/update-stats`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                totalAmount: result.order.totalAmount
              }),
            });
          } catch (statsError) {
            // Stats update failed, continue
          }
        }

        // Publish to Ably for real-time updates
        try {
          const ch = ably.channels.get(`orders:${tenantUserId}`);
          await ch.publish('order.created', result.order);
        } catch (e) {
          // Ably publish failed
        }

        toast.success(`Manual order #${result.order._id.slice(-4)} created successfully!`);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create manual order');
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
      <div className={`bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:scale-[1.02] ${onlyBeverages ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' : 'border-gray-200 hover:border-gray-300'
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
              <span className="capitalize xs:hidden">{order.status.slice(0, 4)}</span>
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

        {order.specialRequests && (
          <div className="px-3 sm:px-4 lg:px-5 py-2 bg-yellow-50 border-l-4 border-yellow-400 mx-3 sm:mx-4 lg:mx-5 rounded-r-lg">
            <div className="text-yellow-800 text-xs sm:text-sm">
              <strong>Special Notes:</strong> {order.specialRequests}
            </div>
          </div>
        )}

        {/* Simple Items List */}
        <div className="px-3 sm:px-4 lg:px-5 py-2">
          <div className="space-y-1">
            {visibleItems.map((item, index) => (
              <div key={item._id || index} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 text-xs border-b border-gray-100 last:border-b-0 min-h-[28px] gap-1 sm:gap-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
                    {item.quantity}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-gray-900 break-words" title={item.name}>
                      {item.name}
                    </span>
                    {item.size && (
                      <span className="text-gray-500 text-xs flex-shrink-0">({item.size})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-shrink-0 w-full sm:w-auto">
                  <span className="text-gray-600 font-medium text-xs whitespace-nowrap">₹{(item.price * item.quantity)}</span>

                  <div className="flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded whitespace-nowrap ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 w-full overflow-x-hidden">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full max-w-full">
          {/* Mobile-First Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex flex-col gap-3">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-2">
                      <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold text-gray-900">Waiter</h1>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span>{session?.user?.name || 'User'}</span>
                        {hotelName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px] sm:max-w-none">{hotelName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-gray-600 hidden sm:inline">
                        {isConnected ? 'Live' : 'Offline'}
                      </span>
                    </div>
                    <button
                      onClick={fetchData}
                      disabled={refreshing}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-First Stats Cards */}
          <div className="px-3 sm:px-4 md:px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5 sm:p-3 text-white">
                <div className="flex items-center justify-between mb-1">
                  <FiList className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                  <span className="text-xs sm:text-sm font-medium opacity-90">Total</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">{totalItemsCount}</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-2.5 sm:p-3 text-white">
                <div className="flex items-center justify-between mb-1">
                  <FiClock className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                  <span className="text-xs sm:text-sm font-medium opacity-90">Pending</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">{pendingItemsCount}</div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-2.5 sm:p-3 text-white">
                <div className="flex items-center justify-between mb-1">
                  <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                  <span className="text-xs sm:text-sm font-medium opacity-90">Cooking</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">{preparingItemsCount}</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2.5 sm:p-3 text-white">
                <div className="flex items-center justify-between mb-1">
                  <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                  <span className="text-xs sm:text-sm font-medium opacity-90">Ready</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">{readyItemsCount}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2.5 sm:p-3 text-white col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                  <span className="text-xs sm:text-sm font-medium opacity-90">Served</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">{actualServedItemsCount}</div>
              </div>
            </div>
          </div>

          {/* Mobile-First Tab Navigation */}
          <div className="bg-white border-t border-gray-200">
            <div className="px-3 sm:px-4 md:px-6">
              <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[48px] flex items-center gap-2 ${activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FiClock className="w-4 h-4" />
                  <span>Orders</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {activeItemsCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('served-orders')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[48px] flex items-center gap-2 ${activeTab === 'served-orders'
                      ? 'border-green-500 text-green-600 bg-green-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Served Orders</span>
                  <span className="sm:hidden">Served</span>
                  <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {servedItemsCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('manual-order')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[48px] flex items-center gap-2 ${activeTab === 'manual-order'
                      ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Manual Order</span>
                  <span className="sm:hidden">Add</span>
                </button>

                <button
                  onClick={() => setActiveTab('tables')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[48px] flex items-center gap-2 ${activeTab === 'tables'
                      ? 'border-purple-500 text-purple-600 bg-purple-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Tables</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {Array.isArray(tables) ? tables.length : 0}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-gray-50">
            {activeTab === 'orders' && (
              <div className="px-3 sm:px-4 md:px-6 py-4">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FiCheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">No active orders right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((order) => (
                        <OrderCard key={order._id} order={order} />
                      ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'served-orders' && (
              <div className="px-3 sm:px-4 md:px-6 py-4">
                {servedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FiCheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Served Orders</h3>
                    <p className="text-gray-600">Orders will appear here once served</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <div className="px-3 sm:px-4 md:px-6 py-4">
                {/* Simple Clean Layout */}
                <div className="max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Create Manual Order</h2>
                    <p className="text-gray-600">Help customers place orders</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Order Form - Left Side */}
                    <div className="lg:col-span-1 space-y-4">
                      {/* Table Selection */}
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Order Info</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
                            <input
                              type="number"
                              value={selectedTable}
                              onChange={(e) => handleTableChange(e.target.value)}
                              placeholder="Enter table number"
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm ${tableError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                }`}
                              min="1"
                            />
                            {tableError && (
                              <p className="mt-1 text-sm text-red-600">{tableError}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Customer name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Customer phone (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                              maxLength="10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder="Special requests..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>                      
                    </div>

                    {/* Menu Section - Right Side */}
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-lg border">
                        {/* Search and Filters */}
                        <div className="p-4 border-b">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <div className="relative">
                                <input
                                  type="search"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search menu items..."
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                                <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto">
                              {menuCategories.map((category) => {
                                const itemCount = category === 'all'
                                  ? menuItems.length
                                  : menuItems.filter(item => item.category === category).length;

                                if (itemCount === 0 && category !== 'all') return null;

                                return (
                                  <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                  >
                                    <span className="capitalize">{category}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items with Section Sidebar */}
                        <div className="flex flex-col sm:flex-row h-auto sm:h-[600px] md:h-[700px] lg:h-[800px]">
                          {/* Section Sidebar */}
                          <SectionSidebar
                            sections={sections}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            orderPlaced={false}
                            filteredMenu={menuItems}
                          />
                          
                          {/* Menu Items */}
                          <div className="flex-1 p-3 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredMenuItems.length === 0 ? (
                                <div className="col-span-full text-center py-8">
                                  <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-500">No items found</p>
                                </div>
                              ) : (
                                filteredMenuItems.map((item) => (
                                  <MenuCard
                                    key={item._id}
                                    item={item}
                                    quantity={itemQuantities[item._id] || 0}
                                    selectedSizeIndex={selectedSizes[item._id] || 0}
                                    onSizeSelect={handleSizeSelect}
                                    onQuantityIncrement={handleQuantityIncrement}
                                    onQuantityDecrement={handleQuantityDecrement}
                                    onAddToCart={handleAddToCart}
                                    orderPlaced={false}
                                    getPriceForSize={getPriceForSize}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            )}

            {/* BottomCart for Manual Order Tab */}
            <BottomCart
              cart={transformedCartItems}
              onViewCart={handleViewCart}
              isVisible={activeTab === 'manual-order'}
            />

            {/* CartPanel for Manual Order Tab */}
            <CartPanel
              isOpen={isCartPanelOpen}
              onClose={handleCloseCart}
              cart={transformedCartItems}
              orderMessage={orderMessage}
              setOrderMessage={setOrderMessage}
              onPlaceOrder={createManualOrder}
              onClearCart={handleClearCart}
              onQuantityDecrease={handleCartQuantityDecrease}
              onQuantityIncrease={handleCartQuantityIncrease}
              onRemoveItem={handleCartItemRemove}
              getTotalPrice={getTotalPrice}
              orderPlaced={false}
              placingOrder={creatingOrder}
              errorMessage=""
              gstDetails={getManualCartGSTBreakdown()}
            />

            {activeTab === 'tables' && (
              <div className="px-3 sm:px-4 md:px-6 py-4">
                {!Array.isArray(tables) || tables.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FiGrid className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Found</h3>
                    <p className="text-gray-600">Set up tables in admin panel</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                    {tables
                      .filter(table => table && table.number)
                      .sort((a, b) => (a.number || 0) - (b.number || 0))
                      .map((table) => (
                        <TableCard key={table._id || table.number} table={table} />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

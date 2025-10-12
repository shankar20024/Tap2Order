"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import MenuCard from '../components/qr/MenuCard';
import MenuSearch from '../components/qr/MenuSearch';
import SectionSidebar from '../components/qr/CategorySidebar';
import MenuGrid from '../components/qr/MenuGrid';
import { FaShoppingCart, FaPrint, FaTimes } from 'react-icons/fa';
import { printBill } from '../components/bill/PrintBill';

export default function TakeawayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [gstRate, setGstRate] = useState(0);
  const [printBillEnabled, setPrintBillEnabled] = useState(true);
  const [itemQuantities, setItemQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});

  // Set userId from session when available
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
    if (session?.token) {
      setToken(session.token);
    }
  }, [session]);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections');
        if (response.ok) {
          const data = await response.json();
          setSections(data.sections || []);
        }
      } catch (error) {
      }
    };

    if (session) {
      fetchSections();
    }
  }, [session]);

  // Fetch business info including GST details
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/business/info?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();

          // Set GST rate if available
          if (data.gstDetails?.taxRate) {
            const rate = parseFloat(data.gstDetails.taxRate);
            setGstRate(rate);
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    };

    fetchBusinessInfo();
  }, [session]);

  // Load business info from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBusinessInfo = localStorage.getItem('businessInfo');
      if (storedBusinessInfo) {
        const parsedInfo = JSON.parse(storedBusinessInfo);
        setBusinessInfo(parsedInfo);
      }
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store the current URL for redirecting back after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
    }
  }, [status, router]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/menu?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          setMenu(data);

          // Extract unique categories
          const itemCategories = data
            .map(item => item.category)
            .filter(Boolean) // Remove any undefined/null categories
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

          // Create final categories array with 'all' at the beginning
          const uniqueCategories = ['all', ...itemCategories];

          setCategories(uniqueCategories);

          // Set default category to first available category if hideAllButton is true
          if (uniqueCategories.length > 1) {
            setSelectedCategory(uniqueCategories[0]);
          }
        } else {
          toast.error('Invalid menu data format');
        }
      } catch (error) {
        toast.error('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [userId]);

  // Filter out 'all' from categories for takeaway page to avoid duplicate All buttons
  const takeawayCategories = categories.filter(category => category !== 'all');

  // Filter menu items based on search, category, and section
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

    const matchesCategory = selectedCategory === 'All' ||
      selectedCategory === 'all' ||
      item.category === selectedCategory;

    const matchesSection = selectedSection === 'all' || item.section === selectedSection;

    return matchesSearch && matchesCategory && matchesSection;
  });

  // Get sections with item counts for sidebar
  const usedSections = sections.filter(section =>
    menu.some(item => item.section === section.name)
  );

  const sectionsWithCounts = [
    { name: "all", displayName: "All Items", count: menu.length },
    ...usedSections.map(section => ({
      ...section,
      count: menu.filter(item => item.section === section.name).length
    }))
  ];

  // Quantity management functions for mobile UI
  const incrementQuantity = (itemId) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const decrementQuantity = (itemId) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 0) - 1, 0)
    }));
  };

  const handleSizeSelection = (itemId, sizeIndex) => {
    setSelectedSizes(prev => ({
      ...prev,
      [itemId]: sizeIndex
    }));
  };

  const getPriceForSize = (item, sizeIndex = 0) => {
    if (item.pricing && item.pricing.length > 1) {
      return item.pricing[sizeIndex]?.price || item.pricing[0].price;
    }
    return item.price;
  };

  const handleAddToCart = (item) => {
    const quantity = itemQuantities[item._id] || 0;
    if (quantity <= 0) return;
    
    const selectedSizeIndex = selectedSizes[item._id] || 0;
    addToCart(item, selectedSizeIndex);
    
    // Reset quantity after adding to cart
    setItemQuantities(prev => ({
      ...prev,
      [item._id]: 0
    }));
  };

  // Add item to cart
  const addToCart = (item, selectedSizeIndex = 0) => {
    // If item has multiple sizes, use the selected size's price
    const hasMultipleSizes = item.pricing && item.pricing.length > 1;
    const selectedPrice = hasMultipleSizes
      ? item.pricing[selectedSizeIndex].price
      : item.price;

    const selectedSize = hasMultipleSizes
      ? item.pricing[selectedSizeIndex].size
      : 'Regular';

    setCart(prevCart => {
      // Check if item with same ID and size already exists in cart
      const existingItemIndex = prevCart.findIndex(
        cartItem => cartItem._id === item._id &&
          cartItem.selectedSize === selectedSize
      );

      if (existingItemIndex >= 0) {
        // If exists, increase quantity
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        // Otherwise add new item to cart
        return [
          ...prevCart,
          {
            ...item,
            price: selectedPrice,
            quantity: 1,
            selectedSize,
            selectedSizeIndex
          }
        ];
      }
    });
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId, newQuantity, size) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === itemId && item.selectedSize === size) {
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      });
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId, size) => {
    setCart(prevCart =>
      prevCart.filter(item => !(item._id === itemId && item.selectedSize === size))
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Calculate GST amount
  const calculateGST = () => {
    return (cartTotal * gstRate) / 100;
  };

  // Calculate GST amounts based on current cart total and GST rate
  const calculateGstDetails = () => {
    const isGstApplicable = gstRate > 0;

    if (!isGstApplicable) {
      return {
        subtotal: cartTotal,
        cgstRate: 0,
        sgstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        totalGst: 0,
        grandTotal: cartTotal,
        isGstApplicable: false
      };
    }

    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const cgstAmount = (cartTotal * cgstRate) / 100;
    const sgstAmount = (cartTotal * sgstRate) / 100;
    const totalGst = cgstAmount + sgstAmount;
    const grandTotal = cartTotal + totalGst;

    return {
      subtotal: cartTotal,
      cgstRate,
      sgstRate,
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      totalGst: parseFloat(totalGst.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      isGstApplicable: true
    };
  };

  // Save takeaway order to database
  const saveTakeawayOrder = async (orderData) => {
    try {
      if (!session) {
        // Store the order data temporarily before redirecting to login
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        // Store the current URL for redirecting back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Redirect to login
        router.push('/login');
        throw new Error('Please log in to continue with your order');
      }

      // Get the user ID from the session
      const userId = session.user?.id;
      if (!userId) {
        throw new Error('Authentication failed. Please log in again.');
      }

      // Add the user ID to the order data
      const orderWithUser = {
        ...orderData,
        userId: userId,
        staffId: session.user?.staffId || null,
        hotelCode: session.user?.hotelCode || null
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderWithUser)
      });

      if (response.status === 401) {
        // Session might be expired, redirect to login
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        router.push('/login');
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to save order');
      }

      // Clear any pending order data after successful save
      localStorage.removeItem('pendingOrder');
      return await response.json();
    } catch (error) {
      toast.error(error.message || 'Could not save order. Please try again.');
      throw error;
    }
  };

  // Handle completing the order, with an option to print the bill
  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      // Calculate GST details based on business settings
      const gstDetails = calculateGstDetails();


      // Build order items in the format expected by the API
      const orderItems = cart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        subcategory: item.subcategory || '',
        category: item.category || ''
      }));

      // Complete order payload
      const orderData = {
        tableNumber: 'Takeaway',
        cart: orderItems,
        userId: userId,
        customerInfo: {
          name: customerName,
          phone: customerPhone || ''
        },
        status: 'completed',
        paymentStatus: 'paid',
        orderType: 'takeaway',
        totalAmount: gstDetails.grandTotal,
        gstDetails: {
          ...gstDetails,
          gstNumber: businessInfo?.gstDetails?.gstNumber || '',
          taxRate: businessInfo?.gstDetails?.taxRate || 0
        },
        businessInfo: {
          businessName: businessInfo?.businessName || 'Restaurant',
          address: businessInfo?.address || {},
          phone: businessInfo?.phone || '',
          email: businessInfo?.email || '',
          gstNumber: businessInfo?.gstDetails?.gstNumber || '',
          fssaiNumber: businessInfo?.fssaiDetails?.fssaiNumber || ''
        }
      };

      // Save order to database
      const savedOrderResponse = await saveTakeawayOrder(orderData);
      const savedOrder = savedOrderResponse.order;


      if (!savedOrder?.billNumber) {
      }

      // Format the date and time for the bill
      const now = new Date();
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      };
      const formattedDate = now.toLocaleString('en-IN', options);

      // Prepare data for printing with bill number from database
      const printData = {
        orderNumber: savedOrder?.billNumber || savedOrder?._id?.slice(-6).toUpperCase() || `TAKE-${Date.now()}`,
        billNumber: savedOrder?.billNumber || 'N/A',
        tokenNumber: savedOrder?.tokenNumber || 1,
        items: orderItems,
        date: formattedDate,
        total: gstDetails.subtotal,
        gst: gstDetails.totalGst,
        grandTotal: gstDetails.grandTotal,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || 'N/A',
        orderType: 'takeaway',
        paymentStatus: 'paid',
        status: 'completed',
        tableNumber: 'Takeaway',
        createdAt: now.toISOString(),
        gstDetails: {
          ...gstDetails,
          gstNumber: businessInfo?.gstDetails?.gstNumber || '',
          taxRate: businessInfo?.gstDetails?.taxRate || 0
        },
        businessInfo: {
          businessName: businessInfo?.businessName || 'Restaurant',
          address: businessInfo?.address || {},
          phone: businessInfo?.phone || '',
          email: businessInfo?.email || '',
          gstNumber: businessInfo?.gstDetails?.gstNumber || '',
          fssaiNumber: businessInfo?.fssaiDetails?.fssaiNumber || ''
        }
      };

      // Conditionally print the bill
      if (printBillEnabled) {
        await printBill('Takeaway', orderItems, session, printData);
      }

      // Clear cart and form after successful print
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setIsCartOpen(false);

      toast.success(`Order placed successfully! Bill #${savedOrder?.billNumber || 'Generated'}`);
    } catch (error) {
      toast.error(error.message || 'Failed to process order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Desktop Layout - Hidden on Mobile */}
      <main className="hidden lg:block container mx-auto px-3 sm:px-4 md:px-6 pt-25">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
          {/* Left Sidebar - Sections */}
          <div className="w-full lg:w-64 lg:flex-shrink-0 order-1 lg:order-1">
            <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 h-auto lg:h-full overflow-y-auto">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span>📂</span>
                <span>Sections</span>
              </h3>
              <div className="flex lg:flex-col gap-2 lg:space-y-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {sectionsWithCounts.map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setSelectedSection(section.name)}
                    className={`flex-shrink-0 lg:w-full text-left px-3 py-2 sm:py-2.5 rounded-lg transition-colors flex items-center justify-between min-h-[44px] ${selectedSection === section.name
                        ? "bg-orange-100 text-orange-800 border border-orange-200"
                        : "hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm">
                        {section.name === "all" ? "📋" : section.icon || "📂"}
                      </span>
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {section.displayName || section.name}
                      </span>
                    </div>
                    <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${selectedSection === section.name
                        ? "bg-orange-200 text-orange-800"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                      {section.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle - Menu Section */}
          <div className="flex-1 order-3 lg:order-2">
            <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-3 sm:p-4 h-auto lg:h-full overflow-y-auto">
              {/* Search and Category Filter */}
              <div className="mb-3 sm:mb-4">
                <MenuSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categories={takeawayCategories}
                  activeCategory={selectedCategory}
                  setActiveCategory={setSelectedCategory}
                />
              </div>

              {/* Menu Items Grid */}
              {loading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredMenu.map(item => (
                    <div key={item._id} className="cursor-pointer" onClick={() => addToCart(item)}>
                      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {item.pricing?.length > 1
                                ? `₹${item.pricing[0].price} - ₹${item.pricing[item.pricing.length - 1].price}`
                                : `₹${item.price}`}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {item.category === 'veg' ? (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-600 rounded-sm flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded-sm"></div>
                              </div>
                            ) : item.category === 'non-veg' ? (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-600 rounded-sm flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-sm"></div>
                              </div>
                            ) : item.category === 'jain' ? (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-600 rounded-sm flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-600 rounded-sm"></div>
                              </div>
                            ) : (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 rounded-sm flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-sm"></div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Size selector for items with multiple sizes */}
                        {item.pricing?.length > 1 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {item.pricing.map((size, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item, index);
                                  }}
                                  className="px-2 py-1 text-xs border rounded hover:bg-amber-50 hover:border-amber-200 min-h-[32px] flex items-center"
                                >
                                  {size.size} - ₹{size.price}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!item.pricing?.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className="mt-2 w-full py-2 text-xs sm:text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors min-h-[36px] flex items-center justify-center"
                          >
                            Add to Cart
                          </button>
                        )}

                        {item.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Cart/Billing Section */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-3">
            <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 h-auto lg:h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Takeaway Order</h2>
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="lg:hidden p-2 rounded-full hover:bg-gray-100 relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <FaShoppingCart className="text-orange-500 text-lg sm:text-xl" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              <div className={`${isCartOpen ? 'block' : 'hidden lg:block'}`}>
                {/* Customer Details */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Details</h3>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Order Items</h3>
                    <span className="text-xs sm:text-sm text-gray-500">{cart.length} items</span>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6 sm:py-4">Your cart is empty</p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-64 overflow-y-auto pr-1 sm:pr-2">
                      {cart.map(item => (
                        <div key={`${item._id}-${item.selectedSize}`} className="flex justify-between items-start border-b pb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                              {item.name}
                              {item.selectedSize && item.selectedSize !== 'Regular' && (
                                <span className="text-xs text-gray-500 ml-1">({item.selectedSize})</span>
                              )}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              ₹{item.price} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity - 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 min-h-[32px] min-w-[32px] flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="px-2 text-sm">{item.quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity + 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 min-h-[32px] min-w-[32px] flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item._id, item.selectedSize);
                              }}
                              className="text-gray-400 hover:text-red-500 min-h-[32px] min-w-[32px] flex items-center justify-center"
                            >
                              <FaTimes className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm sm:text-base text-gray-600">Subtotal</span>
                    <span className="text-sm sm:text-base">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm sm:text-base text-gray-600">GST ({gstRate}%)</span>
                      <span className="text-sm sm:text-base">₹{calculateGST().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base sm:text-lg mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>₹{(cartTotal + calculateGST()).toFixed(2)}</span>
                  </div>

                  {/* Print Bill Toggle */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Print Bill</span>
                    <label htmlFor="print-toggle" className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printBillEnabled}
                        onChange={() => setPrintBillEnabled(!printBillEnabled)}
                        id="print-toggle"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleCompleteOrder}
                    disabled={cart.length === 0}
                    className={`w-full mt-4 sm:mt-6 py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center space-x-2 min-h-[48px] text-sm sm:text-base ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                  >
                    {printBillEnabled && <FaPrint className="text-sm" />}
                    <span>{printBillEnabled ? 'Print & Complete Order' : 'Complete Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Layout - Hidden on Desktop */}
      <div className="lg:hidden h-screen bg-gray-50 overflow-hidden pt-20">
        {/* Professional Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">🥡</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">Takeaway Order</h1>
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 bg-orange-100 rounded-lg border border-orange-200">
                      <p className="text-xs font-medium text-orange-700">{cart.length} items</p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <FaShoppingCart className="text-orange-500 text-xl" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <MenuSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          orderPlaced={false}
        />

        {/* Main Layout with Sidebar */}
        <div className="flex h-[calc(100vh-180px)]">
          {/* Section Sidebar - 20% width */}
          <SectionSidebar
            sections={sections}
            activeSection={selectedSection === 'all' ? 'All' : selectedSection}
            setActiveSection={(section) => setSelectedSection(section === 'All' ? 'all' : section)}
            orderPlaced={false}
            filteredMenu={menu}
          />

          {/* Main Content Area - 80% width, Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <MenuGrid
              filteredMenu={filteredMenu}
              loading={loading}
              itemQuantities={itemQuantities}
              selectedSizes={selectedSizes}
              onSizeSelect={handleSizeSelection}
              onQuantityIncrement={incrementQuantity}
              onQuantityDecrement={decrementQuantity}
              onAddToCart={handleAddToCart}
              orderPlaced={false}
              getPriceForSize={getPriceForSize}
              activeSection={selectedSection === 'all' ? 'All' : selectedSection}
            />
          </div>
        </div>

        {/* Mobile Cart Overlay */}
        {isCartOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsCartOpen(false)}>
            <div 
              className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <FaTimes className="text-gray-600 text-xl" />
                </button>
              </div>

              <div className="p-4">
                {/* Customer Details */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Details</h3>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Order Items</h3>
                    <span className="text-sm text-gray-500">{cart.length} items</span>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={`${item._id}-${item.selectedSize}`} className="flex justify-between items-start border-b pb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {item.name}
                              {item.selectedSize && item.selectedSize !== 'Regular' && (
                                <span className="text-xs text-gray-500 ml-1">({item.selectedSize})</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              ₹{item.price} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity - 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="px-2 text-sm">{item.quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity + 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item._id, item.selectedSize);
                              }}
                              className="text-gray-400 hover:text-red-500 min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <FaTimes className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">GST ({gstRate}%)</span>
                      <span className="text-sm">₹{calculateGST().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>₹{(cartTotal + calculateGST()).toFixed(2)}</span>
                  </div>

                  {/* Print Bill Toggle */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-600 font-medium">Print Bill</span>
                    <label htmlFor="mobile-print-toggle" className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printBillEnabled}
                        onChange={() => setPrintBillEnabled(!printBillEnabled)}
                        id="mobile-print-toggle"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleCompleteOrder}
                    disabled={cart.length === 0}
                    className={`w-full mt-6 py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center space-x-2 min-h-[48px] text-base ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                  >
                    {printBillEnabled && <FaPrint className="text-sm" />}
                    <span>{printBillEnabled ? 'Print & Complete Order' : 'Complete Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

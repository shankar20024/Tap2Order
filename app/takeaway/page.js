"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import MenuCard from '../components/qr/MenuCard';
import MenuSearch from '../components/qr/MenuSearch';
import { FaShoppingCart, FaPrint, FaTimes } from 'react-icons/fa';
import { printBill } from '../components/bill/PrintBill';

export default function TakeawayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [gstRate, setGstRate] = useState(0);

  // Set userId from session when available
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
    if (session?.token) {
      setToken(session.token);
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
            setGstRate(parseFloat(data.gstDetails.taxRate));
          }
        }
      } catch (error) {
        console.error('Error fetching business info:', error);
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
          console.error('Unexpected menu data format:', data);
          toast.error('Invalid menu data format');
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast.error('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [userId]);

  // Filter out 'all' from categories for takeaway page to avoid duplicate All buttons
  const takeawayCategories = categories.filter(category => category !== 'all');

  // Filter menu items based on search and category
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    const matchesCategory = selectedCategory === 'All' || 
                           selectedCategory === 'all' || 
                           item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
        newCart[existingItemIndex].quantity += 0.5;
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
        console.error('No user ID found in session');
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
      console.error('Error saving takeaway order:', error);
      toast.error(error.message || 'Could not save order. Please try again.');
      throw error;
    }
  };

  // Handle print bill
  const handlePrintBill = async () => {
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
        totalAmount: gstDetails.subtotal,
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

      // Prepare data for printing
      const printData = {
        orderNumber: savedOrder?.orderNumber || savedOrder?._id?.slice(-6).toUpperCase() || `TAKE-${Date.now()}`,
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

      // Print the bill with the complete order data
      await printBill('Takeaway', orderItems, session, printData);
      
      // Clear cart and form after successful print
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setIsCartOpen(false);
      
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error(error.message || 'Failed to process order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu Section */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Takeaway Menu</h1>
              
              {/* Search and Category Filter */}
              <div className="mb-6">
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
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenu.map(item => (
                    <div key={item._id} className="cursor-pointer" onClick={() => addToCart(item)}>
                      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.pricing?.length > 1 
                                ? `₹${item.pricing[0].price} - ₹${item.pricing[item.pricing.length - 1].price}`
                                : `₹${item.price}`}
                            </p>
                          </div>
                          {item.veg ? (
                            <div className="w-5 h-5 border-2 border-green-600 rounded-sm flex items-center justify-center">
                              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-red-600 rounded-sm flex items-center justify-center">
                              <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Size selector for items with multiple sizes */}
                        {item.pricing?.length > 1 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {item.pricing.map((size, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item, index);
                                  }}
                                  className="px-2 py-1 text-xs border rounded hover:bg-amber-50 hover:border-amber-200"
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
                            className="mt-2 w-full py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                          >
                            Add to Cart
                          </button>
                        )}
                        
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                        )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Cart Section */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Takeaway Order</h2>
                <button 
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="md:hidden p-2 rounded-full hover:bg-gray-100"
                >
                  <FaShoppingCart className="text-orange-500 text-xl" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
              
              <div className={`${isCartOpen ? 'block' : 'hidden md:block'}`}>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    <p className="text-sm text-gray-500 text-center py-4">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                      {cart.map(item => (
                        <div key={`${item._id}-${item.selectedSize}`} className="flex justify-between items-start border-b pb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.name} 
                              {item.selectedSize && item.selectedSize !== 'Regular' && (
                                <span className="text-xs text-gray-500 ml-1">({item.selectedSize})</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              ₹{item.price} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center border rounded-md">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity - 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="px-2">{item.quantity}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartItemQuantity(item._id, item.quantity + 1, item.selectedSize);
                                }}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item._id, item.selectedSize);
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <FaTimes />
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
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">GST ({gstRate}%)</span>
                      <span>₹{calculateGST().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>₹{(cartTotal + calculateGST()).toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={handlePrintBill}
                    disabled={cart.length === 0}
                    className={`w-full mt-6 py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center space-x-2 ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                  >
                    <FaPrint />
                    <span>Print & Complete Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

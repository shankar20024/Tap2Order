"use client";

import { use } from "react";
import { useEffect, useState, useRef } from "react";
import ably from "@/lib/ably";
import toast from 'react-hot-toast';
import Logo from "@/app/components/Logo";
import Image from "next/image";
import OrderViewer from "@/app/components/OrderViewer";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdOutlineRestaurantMenu, MdMessage } from "react-icons/md";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/app/components/Header";


export default function QRMenu(paramsPromise) {
  const { userId, tableNumber } = use(paramsPromise.params);
  const [username, setUsername] = useState('');
  const [apiStatus, setApiStatus] = useState(true); // Track API status



  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Use the new session-less endpoint
        const res = await fetch(`/api/me/user?userId=${userId}`);
        if (res.ok) {
          const userData = await res.json();
          setUsername(userData.name);
          setApiStatus(true);
        } else {
          const errorData = await res.json();
          console.error('Error:', errorData.error);
          setUsername('wait for user login');
          setApiStatus(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUsername('wait for user login');
        setApiStatus(false);
      }
    };
    fetchUser();
  }, []);

  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [tableExists, setTableExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [prepTime, setPrepTime] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [showCartArrow, setShowCartArrow] = useState(false);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const cartButtonRef = useRef(null);

  // New state: quantity selectors per menu item _id, default 0
  const [itemQuantities, setItemQuantities] = useState({});
  // const [previousOrder, ] = useState(null); // Store previous order



  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/menu?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMenu(data);

        const uniqueCategories = Array.from(new Set(data.map(item => item.category || "Uncategorized")));
        setCategories(uniqueCategories);
        setActiveCategory('All'); // Set to 'All' by default
        setFilteredMenu(data);
      } else {
        console.error("Failed to fetch menu");
      }
    } catch (err) {
      console.error("Menu fetch error:", err);
    }
  };

  const checkTableExistence = async () => {
    try {
      const res = await fetch(`/api/table/check?userId=${userId}&tableNumber=${tableNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.exists) {
          setTableExists(false);
        }
      } else {
        setTableExists(false);
      }
    } catch (err) {
      console.error("Error checking table existence:", err);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchMenu(),
        // loadCart(),
        checkTableExistence()
      ]);
    };
    fetchInitialData();
  }, [userId, tableNumber]);

  useEffect(() => {
    if (!orderPlaced) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, orderPlaced]);

  // Track previous cart length to detect new additions
  const prevCartLengthRef = useRef(0);

  useEffect(() => {
    if (!orderPlaced) {
      localStorage.setItem("cart", JSON.stringify(cart));
      
      // Only show arrow when items are added (cart length increases)
      if (cart.length > prevCartLengthRef.current && cart.length > 0) {
        setShowCartArrow(true);
      }
      prevCartLengthRef.current = cart.length;
    }
  }, [cart, orderPlaced]);

  useEffect(() => {
    if (!orderPlaced) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, orderPlaced]);

  useEffect(() => {
    let filtered = menu.filter(item => item.available);
    if (activeCategory && activeCategory !== 'All') {
      filtered = filtered.filter(item => (item.category || "Uncategorized") === activeCategory);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredMenu(filtered);
  }, [menu, activeCategory, searchTerm]);

  const handleOrderUpdate = async (msg) => {
    const updatedOrder = msg.data;

    if (updatedOrder && updatedOrder.tableNumber === tableNumber) {
      setCart([]);
      setItemQuantities({});
      setOrderPlaced(false);
      setCartOpen(false);
      localStorage.removeItem("cart");

      // await loadCart();

      if (updatedOrder.status === "completed") {
        alert("Order completed. Ready for the next customer.");
      } else if (updatedOrder.status === "cancelled") {
        alert("Order cancelled. Ready for the next customer.");
      }
    }
  };


  useEffect(() => {
    const channel = ably.channels.get("orders");

    handleOrderUpdate({ data: { tableNumber } });

    channel.subscribe("order-updated", handleOrderUpdate);

    return () => {
      channel.unsubscribe("order-updated", handleOrderUpdate);
    };
  }, [tableNumber]);

  const addToCart = (item, quantity = 1, isUpdate = false) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    if (quantity <= 0) return;

    // If item is a string, it's a menuItemId from the cart
    const isItemObject = typeof item === 'object';
    const itemId = isItemObject ? String(item._id || '') : String(item);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => String(i.menuItemId) === itemId);

      if (existingIndex >= 0) {
        // Item exists, update quantity
        return prevCart.map((cartItem, idx) => {
          if (idx === existingIndex) {
            // If isUpdate is true, set the quantity directly, otherwise add to it
            const newQuantity = isUpdate
              ? quantity
              : cartItem.quantity + quantity;

            return {
              ...cartItem,
              quantity: Math.max(1, newQuantity) // Ensure quantity is at least 1
            };
          }
          return cartItem;
        });
      } else if (isItemObject) {
        // Only add new item if we have the full item object
        return [...prevCart, {
          menuItemId: itemId,
          name: item.name,
          price: item.price,
          quantity: Math.max(1, quantity), // Ensure quantity is at least 1
          notes: ''
        }];
      }
      return prevCart; // Return unchanged if item not found and not adding new
    });
  };

  const decreaseQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    const existing = cart.find(i => i.menuItemId === itemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(i => i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const removeFromCart = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setCart(cart.filter((i) => i.menuItemId !== itemId));
  };

  const clearCart = () => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemSubtotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  const placeOrder = async () => {
    setCart([]);
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty, please add items before placing order.");
      return;
    }

    setErrorMessage('');
    setPlacingOrder(true);
    setOrderMessage('');

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          cart: cart.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          })),
          userId,
          orderMessage
        }),
      });

      if (!res.ok) throw new Error("Order failed");

      const orderData = await res.json();

      // Prepare detailed cart
      const detailedCart = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: getItemSubtotal(item),
        total: getTotalPrice()
      }));

      // Ably publish with order ID
      const channel = ably.channels.get("orders");
      await channel.publish("new-order", {
        _id: orderData._id, // Proper order ID from API
        tableNumber,
        items: detailedCart,
        message: orderMessage,
        timestamp: Date.now(),
        userId: userId,
        status: "pending"
      });
      setCartOpen(false);
      toast.success(`Order placed successfully`);

      // Subscribe to order updates
      channel.subscribe("order-updated", async (msg) => {
        const updatedOrder = msg.data;
        if (updatedOrder._id === orderData._id) {
          // Only clear cart when the order is actually updated
          if (updatedOrder.status === "completed" || updatedOrder.status === "cancelled") {
            // Reset the cart and clear localStorage on order completion/cancellation
            setCart([]);
            localStorage.removeItem("cart");
            setOrderPlaced(false);
            setCartOpen(false);
            setItemQuantities({});
            toast.success(`Order #${updatedOrder._id} has been ${updatedOrder.status === "completed" ? "completed" : "cancelled"}. You can place a new order.`);
          }
        }
      });

      // Show alert without clearing cart


      setPrepTime(15 + Math.floor(Math.random() * 15));
    } catch (err) {
      setErrorMessage('Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setPlacingOrder(false);
    }

  };

  // Handlers for quantity selector in menu items




  const incrementQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setItemQuantities(qtys => {
      const current = qtys[itemId] || 0;
      return { ...qtys, [itemId]: current + 1 };
    });
  };

  const decrementQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setItemQuantities(qtys => {
      const current = qtys[itemId] || 0;
      if (current <= 0) return qtys;
      return { ...qtys, [itemId]: current - 1 };
    });
  };

  // On Add To Cart from menu item, add the selected quantity and reset selector
  const handleAddToCart = (item) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    const qty = itemQuantities[item._id] || 0;
    if (qty <= 0) return;
    addToCart(item, qty);
    setItemQuantities(qtys => ({ ...qtys, [item._id]: 0 }));
    
    // Show arrow animation
    setShowCartArrow(true);
  };

  // Track cart button position for arrow animation
  useEffect(() => {
    if (cartButtonRef.current) {
      const updateArrowPosition = () => {
        const rect = cartButtonRef.current.getBoundingClientRect();
        setArrowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      };

      // Update position on mount and when cart opens/closes
      updateArrowPosition();
      window.addEventListener('resize', updateArrowPosition);
      return () => window.removeEventListener('resize', updateArrowPosition);
    }
  }, [cartOpen]);

  const handleCartClick = () => {
    const wasOpen = cartOpen;
    setCartOpen(open => !open);
    
    // Only hide arrow if we're opening the cart
    // This prevents the arrow from disappearing when clicking buttons inside the cart
    if (!wasOpen) {
      setShowCartArrow(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 overflow-hidden">
      <div className="flex items-center justify-center">
        <LoadingSpinner size="40" />
      </div>
    </div>
  );
  if (!tableExists) {
    return (
      <div className="p-6 text-center text-red-600 text-lg font-semibold" role="alert">
        This table is not available.
      </div>
    );
  }

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="min-h-screen relative ">
        <div className="absolute inset-0 -z-10 w-full h-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="p-6 max-w-4xl mx-auto font-sans relative">

          {/* Header */}
          <header className="mb-6 px-6 py-4 bg-white shadow-md rounded-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2">
              <Logo className="text-5xl" />

              <p className="text-gray-700 text-sm">
                Welcome to <span className="font-semibold">{username}</span>
              </p>
            </div>
          </header>


          {/* View My Order Button */}
          <button
            onClick={() => setViewOrderModalOpen(true)}
            className="fixed bottom-5 right-4 bg-amber-400 text-darkAmber px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300 transition-colors"
          >
            My Orders
          </button>


          {/* Order Viewer Modal */}
          <OrderViewer
            userId={userId}
            tableNumber={tableNumber}
            isOpen={viewOrderModalOpen}
            onClose={() => setViewOrderModalOpen(false)}
          />
          <h1 className="text-3xl font-extrabold  text-amber-600 text-center ">Menu</h1>
          <p className="text-gray-700 text-sm  ">
            Table Number: <span className="font-semibold">{tableNumber}</span>
          </p>


          {/* Cart Icon with ref for arrow animation */}
          <div className="fixed top-20 right-7 z-49">
            <div ref={cartButtonRef} className="relative">
              <button
                onClick={handleCartClick}
                aria-label={`Toggle cart, ${totalItemsCount} items in cart`}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-300"
              >
                <HiOutlineShoppingCart className="w-7 h-7" />

                {totalItemsCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-md animate-pulse"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* Animated Arrow to Cart */}
              <AnimatePresence>
                {showCartArrow && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ 
                      opacity: 1, 
                      y: 15,
                      transition: { 
                        y: { 
                          repeat: Infinity, 
                          duration: 1.5,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        },
                        opacity: { duration: 0.3 }
                      }
                    }}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 w-24 text-center z-50 pointer-events-none mt-2"
                  >
                    <div className="text-amber-600 font-bold text-sm mb-1 whitespace-nowrap bg-white/90 px-2 py-1 rounded shadow-lg">
                      View Cart
                    </div>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-amber-500 mx-auto"
                    >
                      <path 
                        d="M19 14L12 7M12 7L5 14M12 7V21" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart Panel */}
          <div
            className={`fixed inset-0 z-40 flex justify-end items-start p-2 sm:p-4 transition-all duration-300 
    ${cartOpen ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/30' : 'opacity-0 pointer-events-none'}`}
            role="region"
            aria-label="cart panel"
            onClick={() => setCartOpen(false)} // click outside to close
          >
            <div className="w-full max-w-md mt-16 sm:mt-20">
              <div
                className={`w-full bg-white border border-gray-200 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out max-h-[85vh] flex flex-col ${
                  cartOpen ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()} // prevent backdrop click when clicking inside cart
              >
                <div className="flex justify-between items-center border-b px-4 py-3 sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-bold text-amber-600">Your Cart</h2>
                  <button
                    onClick={() => setCartOpen(false)}
                    aria-label="Close cart"
                    className="p-2 -mr-2 text-gray-700 hover:text-amber-600 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 flex-1 flex items-center justify-center">
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <ul className="divide-y divide-gray-100">
                        {cart.map(item => (
                          <li key={item.menuItemId} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                <p className="text-sm text-gray-500">₹{(item.price ?? 0).toFixed(2)} each</p>
                                <p className="text-sm text-green-600 font-medium mt-1">
                                  Subtotal: ₹{getItemSubtotal(item)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => decreaseQuantity(item.menuItemId)}
                                  disabled={orderPlaced}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span aria-live="polite" aria-atomic="true" className="w-6 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => addToCart(item.menuItemId, item.quantity + 1, true)}
                                  disabled={orderPlaced}
                                  aria-label={`Increase quantity of ${item.name}`}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                                >
                                  +
                                </button>
                                {!orderPlaced && (
                                  <button
                                    onClick={() => removeFromCart(item.menuItemId)}
                                    aria-label={`Remove ${item.name} from cart`}
                                    className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span className="text-amber-600">₹{getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <div className="mb-4">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MdMessage className="text-gray-500 text-lg" />
                              <span className="text-sm font-medium text-gray-700">Special Instructions</span>
                            </div>
                            <div className="relative">
                              <textarea
                                value={orderMessage}
                                onChange={(e) => setOrderMessage(e.target.value)}
                                placeholder="Add any special instructions"
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-700 placeholder-gray-400"
                                rows="3"
                                maxLength="200"
                                style={{
                                  resize: 'none',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <div className="text-right text-xs text-gray-500 mt-1">
                                {orderMessage.length}/200
                              </div>
                            </div>
                          </div>
                        </div>

                        {!orderPlaced && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={placeOrder}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={cart.length === 0}
                            >
                              <MdOutlineRestaurantMenu className="text-xl" />
                              <span>Place Order</span>
                            </button>

                            <button
                              onClick={clearCart}
                              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={cart.length === 0}
                            >
                              <FaTrash className="text-lg" />
                              <span className="sm:hidden">Clear</span>
                              <span className="hidden sm:inline">Clear Cart</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {errorMessage && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-red-600 text-sm font-medium" role="alert">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Search and Categories */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <input
              type="search"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 flex-grow"
              aria-label="Search menu items"
              disabled={orderPlaced}
            />

            <nav aria-label="Menu categories" className="flex flex-wrap gap-2 justify-center">

              <button
                onClick={() => setActiveCategory('All')}
                className={`rounded-full px-4 py-1 text-sm font-semibold transition 
    ${activeCategory === 'All'
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-amber-300 hover:text-white'}`}
                aria-current={activeCategory === 'All' ? 'true' : undefined}
                disabled={orderPlaced}
              >
                All
              </button>

              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-1 text-sm font-semibold transition 
      ${activeCategory === category
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-amber-300 hover:text-white'}`}
                  aria-current={activeCategory === category ? 'true' : undefined}
                  disabled={orderPlaced}
                >
                  {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
                </button>
              ))}
            </nav>

          </div>

          {/* Menu Items Grid */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 overflow-y-auto h-[calc(100vh-360px)]">
            {filteredMenu.length === 0 && (
              <li className="col-span-full text-center text-gray-500 font-medium py-10">
                No menu items found.
              </li>
            )}
            {filteredMenu.map(item => {
              const quantity = itemQuantities[item._id] || 0;
              return (
                <li key={item._id} className={`  bg-white border border-gray-200 rounded-2xl shadow-md p-4 mb-2 flex flex-col h-[200px] ${!item.available ? 'opacity-50' : 'hover:shadow-lg transition-shadow duration-300'}`} aria-disabled={!item.available}>
                   <div className="flex flex-col flex-grow">
                    <div className="flex justify-start items-center gap-2 mb-2">
                      {/* Category Badge */}
                      {item.category === "veg" ? (
                        <div className="veg-badge-container rounded-full border-green-600 border-2 h-5 w-5 flex items-center justify-center">
                          <div className="circle bg-green-600 h-3 w-3 rounded-full" />
                        </div>
                      ) : (
                        <div className="non-veg-badge-container rounded-sm border-red-500 border-2 h-5 w-5 flex items-center justify-center">
                          <div className="triangle w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-600" />
                        </div>
                      )}

                      {/* Item Name */}
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                    </div>
                    {/* Item Description */}
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                    {/* Item Price */}
                    <div className="font-bold text-amber-600 text-lg">₹{item.price.toFixed(2)}</div>
                    {/* Item Availability */}
                    {!item.available && (
                      <span className="text-red-600 font-semibold mt-1">Unavailable</span>
                    )}

                    {/* Quantity Selector */}
                    {item.available && (
                      <div className="mt-4 flex items-center gap-4">

                        <button
                          onClick={() => decrementQuantity(item._id)}
                          disabled={orderPlaced || quantity === 0}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 select-none disabled:opacity-50"
                        >
                          −
                        </button>

                        <span aria-live="polite" aria-atomic="true" className="w-8 text-center text-lg font-semibold select-none">{quantity}</span>

                        <button
                          onClick={() => incrementQuantity(item._id)}
                          disabled={orderPlaced}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 select-none disabled:opacity-50"
                        >
                          +
                        </button>


                        {/* Add to Cart button with quantity */}

                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={quantity <= 0 || orderPlaced}
                          className={`ml-auto py-2 px-4 rounded font-semibold text-white focus:outline-none
                          ${quantity > 0 && !orderPlaced ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-400 cursor-not-allowed'}`}
                          aria-disabled={quantity <= 0 || orderPlaced}
                          aria-label={`Add ${quantity} ${item.name} to cart`}
                        >
                          <span className="flex items-center gap-2">
                            <FaPlus />Add
                          </span>
                        </button>

                      </div>
                    )}

                    {/* If not available and no quantity selector */}
                    {!item.available && (

                      <button
                        disabled
                        className="mt-4 py-2 rounded bg-gray-400 text-white cursor-not-allowed"
                      >
                        Not Available
                      </button>

                    )}
                   
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
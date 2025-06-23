"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import ably from "@/lib/ably";
import toast from 'react-hot-toast';
import Logo from "@/app/components/Logo";
import Image from "next/image";
import OrderViewer from "@/app/components/OrderViewer";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdOutlineRestaurantMenu, MdMessage } from "react-icons/md";
import { HiOutlineShoppingCart } from "react-icons/hi";
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
            className="fixed bottom-10 right-4 bg-amber-400 text-darkAmber px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300 transition-colors"
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


          {/* Cart Icon fixed top right */}

          <button
  onClick={() => setCartOpen(open => !open)}
  aria-label={`Toggle cart, ${totalItemsCount} items in cart`}
  className="fixed top-4 right-4 z-50 bg-amber-500 hover:bg-amber-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-300"
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


          {/* Cart Panel */}

          <div
            className={`fixed  inset-0 z-40  flex justify-end items-start p-4 transition-all duration-300 
    ${cartOpen ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/30' : 'opacity-0 pointer-events-none'}`}
            role="region"
            aria-label="cart panel"
            onClick={() => setCartOpen(false)} // click outside to close
          >
            <div className="mt-16">
            <div
              className={`w-80 max-w-full  bg-white border border-gray-300 rounded-lg shadow-xl transform transition-transform duration-300 ease-in-out 
      ${cartOpen ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}
              onClick={(e) => e.stopPropagation()} // prevent backdrop click when clicking inside cart
            >
              <div className="flex justify-between  items-center border-b px-4 py-3">
                <h2 className="text-lg font-bold text-amber-600">Your Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  aria-label="Close cart"
                  className="text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="p-4 text-center text-gray-500">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="max-h-64 overflow-y-auto divide-y">
                    {cart.map(item => (
                      <li key={item.menuItemId} className="flex justify-between items-center p-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-sm text-gray-600">₹{(item.price ?? 0).toFixed(2)} each</span>
                          <span className="text-sm text-green-700 font-medium">
                            Subtotal: ₹{getItemSubtotal(item)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => decreaseQuantity(item.menuItemId)}
                            disabled={orderPlaced}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 select-none disabled:opacity-50"
                          >
                            −
                          </button>
                          <span aria-live="polite" aria-atomic="true" className="w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.menuItemId, item.quantity + 1, true)}
                            disabled={orderPlaced}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 select-none disabled:opacity-50"
                          >
                            +
                          </button>
                          {!orderPlaced && (
                            <button
                              onClick={() => removeFromCart(item.menuItemId)}
                              aria-label={`Remove ${item.name} from cart`}
                              className="text-red-600 hover:underline focus:outline-none"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="px-4 py-3 border-t font-semibold text-lg flex justify-between">
                    <span>Total:</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>

                  <div className="px-4 py-3 flex flex-col gap-3 justify-end border-t">
                    {/* Special Instructions */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MdMessage className="text-gray-500 text-xl" />
                          <span className="text-sm font-semibold text-gray-700">Special Instructions</span>
                        </div>
                        <div className="relative">
                          <textarea
                            value={orderMessage}
                            onChange={(e) => setOrderMessage(e.target.value)}
                            placeholder="Add any special instructions"
                            className="w-64 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm text-gray-700 placeholder:text-gray-400"
                            rows="4"
                            maxLength="200"
                            style={{
                              resize: 'none',
                              fontFamily: 'inherit',
                              lineHeight: '1',
                            }}
                          />
                          <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                            {orderMessage.length}/200
                          </div>
                        </div>
                      </div>
                    </div>

                    {!orderPlaced && (
                      <div className="flex flex-row justify-center items-center gap-4">
                        <button
                          onClick={placeOrder}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium shadow-md hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                          disabled={cart.length === 0}
                        >
                          <MdOutlineRestaurantMenu className="text-2xl" />
                          <span>Place Order</span>
                        </button>

                        <button
                          onClick={clearCart}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium shadow-md hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                          disabled={cart.length === 0}
                        >
                          <FaTrash className="text-2xl" />
                          <span>Clear Cart</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <p className="px-4 pb-4 text-red-600 font-semibold" role="alert">
                      {errorMessage}
                    </p>
                  )}
                </>
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
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredMenu.length === 0 && (
              <li className="col-span-full text-center text-gray-500 font-medium py-10">
                No menu items found.
              </li>
            )}
            {filteredMenu.map(item => {
              const quantity = itemQuantities[item._id] || 0;
              return (
                <li key={item._id} className={` bg-white border border-gray-200 rounded-2xl shadow-md p-2 mb-2 flex flex-col h-full ${!item.available ? 'opacity-50' : 'hover:shadow-lg transition-shadow duration-300'}`} aria-disabled={!item.available}>
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-t-lg" />
                  )}
                  <div className="p-2 flex flex-col flex-grow">
                    <div className="flex  justify-start items-center gap-2 mb-2">
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
                      <h3 className="font-semibold text-lg ">{item.name} </h3>
                    </div>
                    {/* Item Description */}
                    <p className="text-gray-600 flex-grow">{item.description}</p>
                    {/* Item Price */}
                    <div className="mt-2 font-bold text-amber-600 text-xl">₹{item.price.toFixed(2)}</div>
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
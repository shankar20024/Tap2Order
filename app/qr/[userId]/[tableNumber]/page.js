"use client";

import { use, useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import OrderViewer from "@/app/components/OrderViewer";

// QR Components
import QRHeader from "@/app/components/qr/QRHeader";
import MenuSearch from "@/app/components/qr/MenuSearch";
import MenuGrid from "@/app/components/qr/MenuGrid";
import CartButton from "@/app/components/qr/CartButton";
import CartPanel from "@/app/components/qr/CartPanel";

// Custom Hooks
import useCart from "@/app/hooks/useCart";
import useMenu from "@/app/hooks/useMenu";
import useQuantity from "@/app/hooks/useQuantity";
import useOrder from "@/app/hooks/useOrder";

export default function QRMenu(paramsPromise) {
  const { userId, tableNumber } = use(paramsPromise.params);
  
  // State
  const [username, setUsername] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [apiStatus, setApiStatus] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [showCartArrow, setShowCartArrow] = useState(false);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);

  // Custom Hooks
  const {
    menu,
    filteredMenu,
    categories,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    loading: menuLoading,
    getPriceForSize
  } = useMenu(userId);

  const {
    cart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItemsCount,
    resetCart
  } = useCart(apiStatus, false);

  const {
    itemQuantities,
    selectedSizes,
    incrementQuantity,
    decrementQuantity,
    resetQuantity,
    handleSizeSelection,
    getQuantity,
    getSelectedSize
  } = useQuantity(apiStatus, false);

  const {
    orderPlaced,
    placingOrder,
    errorMessage,
    orderMessage,
    setOrderMessage,
    placeOrder
  } = useOrder(userId, tableNumber, cart, getTotalPrice, resetCart);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/me/user?userId=${userId}`);
        if (res.ok) {
          const userData = await res.json();
          setUsername(userData.name);
          
          // If the user has a hotel code, use it to get the hotel name
          if (userData.hotelCode) {
            try {
              const hotelRes = await fetch(`/api/hotels`);
              if (hotelRes.ok) {
                const { hotels } = await hotelRes.json();
                const currentHotel = hotels.find(h => h.hotelCode === userData.hotelCode);
                if (currentHotel) {
                  setHotelName(currentHotel.businessName || currentHotel.name);
                }
              }
            } catch (error) {
              console.error('Error fetching hotel data:', error);
            }
          }
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
  }, [userId]);

  // Check table existence
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
    checkTableExistence();
  }, [userId, tableNumber]);

  // Handle add to cart with quantity reset
  const handleAddToCart = useCallback((item) => {
    if (!apiStatus) return;
    
    const qty = getQuantity(item._id);
    if (qty <= 0) return;
    
    const selectedSizeIndex = getSelectedSize(item._id);
    const currentPrice = getPriceForSize(item, selectedSizeIndex);
    
    let sizeInfo = "";
    if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 1) {
      sizeInfo = item.pricing[selectedSizeIndex]?.size || "";
    }
    
    const itemWithPrice = {
      ...item,
      price: currentPrice,
      size: sizeInfo
    };
    
    addToCart(itemWithPrice, qty);
    resetQuantity(item._id);
    setShowCartArrow(true);
  }, [apiStatus, getQuantity, getSelectedSize, getPriceForSize, addToCart, resetQuantity]);

  // Handle cart button click
  const handleCartClick = useCallback(() => {
    const wasOpen = cartOpen;
    setCartOpen(!cartOpen);
    
    if (!wasOpen) {
      setShowCartArrow(false);
    }
  }, [cartOpen]);

  // Handle arrow position update
  const handleArrowPositionUpdate = useCallback((position) => {
    setArrowPosition(position);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 overflow-hidden">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="40" />
        </div>
      </div>
    );
  }

  // Table not found
  if (!tableExists) {
    return (
      <div className="p-6 text-center text-red-600 text-lg font-semibold" role="alert">
        This table is not available.
      </div>
    );
  }

  const totalItemsCount = getTotalItemsCount();

  return (
    <div className="">
      {/* Background Pattern */}
      
      {/* Header */}
      <QRHeader 
        username={username}
        hotelName={hotelName}
        tableNumber={tableNumber}
        apiStatus={apiStatus}
      />

      {/* Search & Filters */}
      <MenuSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        orderPlaced={orderPlaced}
      />

      {/* Menu Grid */}
      <MenuGrid
        filteredMenu={filteredMenu}
        loading={menuLoading}
        itemQuantities={itemQuantities}
        selectedSizes={selectedSizes}
        onSizeSelect={handleSizeSelection}
        onQuantityIncrement={incrementQuantity}
        onQuantityDecrement={decrementQuantity}
        onAddToCart={handleAddToCart}
        orderPlaced={orderPlaced}
        getPriceForSize={getPriceForSize}
      />

      {/* Cart Button */}
      <CartButton
        totalItemsCount={totalItemsCount}
        onClick={handleCartClick}
        showArrow={showCartArrow}
        onArrowPositionUpdate={handleArrowPositionUpdate}
      />

      {/* Cart Panel */}
      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        orderMessage={orderMessage}
        setOrderMessage={setOrderMessage}
        onPlaceOrder={placeOrder}
        onClearCart={clearCart}
        onQuantityDecrease={decreaseQuantity}
        onQuantityIncrease={addToCart}
        onRemoveItem={removeFromCart}
        getTotalPrice={getTotalPrice}
        orderPlaced={orderPlaced}
        placingOrder={placingOrder}
        errorMessage={errorMessage}
      />

      {/* My Orders Button */}
      <button
        onClick={() => setViewOrderModalOpen(true)}
        className="fixed bottom-5 left-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 
                 rounded-full shadow-lg transition-colors duration-200 z-30
                 focus:outline-none focus:ring-4 focus:ring-blue-300"
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
    </div>
  );
}
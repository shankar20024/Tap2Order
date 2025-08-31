"use client";

import { use, useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import OrderViewer from "@/app/components/OrderViewer";
import { getAbly } from "@/lib/ably";

// QR Components
import QRHeader from "@/app/components/qr/QRHeader";
import MenuSearch from "@/app/components/qr/MenuSearch";
import MenuGrid from "@/app/components/qr/MenuGrid";
import BottomCart from "@/app/components/qr/BottomCart";
import CartPanel from "@/app/components/qr/CartPanel";
import CustomerInfoModal from "@/app/components/qr/CustomerInfoModal";

// Custom Hooks
import useCart from "@/app/hooks/useCart";
import useMenu from "@/app/hooks/useMenu";
import useQuantity from "@/app/hooks/useQuantity";
import useOrder from "@/app/hooks/useOrder";

export default function QRMenu(paramsPromise) {
  const { userId, tableNumber } = use(paramsPromise.params);
  
  // State
  const [username, setUsername] = useState('Restaurant');
  const [hotelName, setHotelName] = useState('Restaurant');
  const [apiStatus, setApiStatus] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [showCartArrow, setShowCartArrow] = useState(false);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerInfoSubmitted, setCustomerInfoSubmitted] = useState(false);
  const [isTableLocked, setTableLocked] = useState(false);
  const [originalCustomer, setOriginalCustomer] = useState(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  // Ably real-time subscription for page reload
  useEffect(() => {
    if (!userId || !tableNumber) return;

    const ably = getAbly();
    const channel = ably.channels.get(`table-reload:${userId}:${tableNumber}`);

    const handleReload = () => {
      window.location.reload();
    };

    channel.subscribe('reload', handleReload);

    return () => {
      channel.unsubscribe('reload', handleReload);
    };
  }, [userId, tableNumber]);

  // GST Calculation Function
  const calculateGST = useCallback((subtotal) => {
    const taxRate = businessInfo?.gstDetails?.taxRate || 0;
    const hasGstNumber = businessInfo?.gstDetails?.gstNumber && businessInfo.gstDetails.gstNumber.trim() !== '';
    
    let gstDetails = {
      subtotal: subtotal,
      cgstAmount: 0,
      sgstAmount: 0,
      totalGst: 0,
      grandTotal: subtotal,
      isGstApplicable: false,
      taxRate: taxRate
    };

    // Apply GST only if user has GST number and tax rate > 0
    if (hasGstNumber && taxRate > 0) {
      const totalTax = subtotal * (taxRate / 100);
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      gstDetails = {
        subtotal: subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalGst: totalTax,
        grandTotal: subtotal + totalTax,
        isGstApplicable: true,
        taxRate: taxRate
      };
    }

    return gstDetails;
  }, [businessInfo]);

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
    prepTime,
    placeOrder,
    customerInfo: orderCustomerInfo,
    setCustomerInfo: setOrderCustomerInfo,
    resetOrderState
  } = useOrder(userId, tableNumber, cart, getTotalPrice, resetCart, calculateGST(getTotalPrice()));

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await fetch(`/api/me/user?userId=${userId}`);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUsername(userData.username);
          setHotelName(userData.hotelName || userData.username);
          setApiStatus(true);
        } else {
          setApiStatus(false);
        }
      } catch (error) {
        setApiStatus(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const businessResponse = await fetch(`/api/business/info?userId=${userId}`);

        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          setBusinessInfo(businessData);
        }
      } catch (error) {
        // Error fetching business info, continue
      }
    };

    if (userId) {
      fetchBusinessInfo();
    }
  }, [userId]);

  // Check table existence and status
  useEffect(() => {
    const checkTable = async () => {
      setLoading(true);
      try {
        // First, check if the table is occupied
        const statusRes = await fetch(`/api/table-status/${userId}/${tableNumber}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.isOccupied) {
            setTableLocked(true);
            setOriginalCustomer(statusData.customerInfo);
          }
        } else {
          // If status check fails, proceed but maybe log an error
          console.error('Could not verify table status.');
        }

        // Then, check if the table physically exists
        const existenceRes = await fetch(`/api/table/check?userId=${userId}&tableNumber=${tableNumber}`);
        if (existenceRes.ok) {
          const existenceData = await existenceRes.json();
          if (!existenceData.exists) {
            setTableExists(false);
          }
        } else {
          setTableExists(false);
        }
      } catch (err) {
        setTableExists(false); // Assume table doesn't exist on error
      } finally {
        setLoading(false);
      }
    };

    if (userId && tableNumber) {
        checkTable();
    }
  }, [userId, tableNumber]);

  // Customer Info Management
  useEffect(() => {
    if (!customerInfoSubmitted) {
      // Show modal after 500ms if customer info hasn't been submitted in the current session
      const timer = setTimeout(() => {
        setShowCustomerModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customerInfoSubmitted]);

  // Handle customer info submission
  const handleCustomerInfoSubmit = async (info) => {
    setLoading(true);
    setAccessDeniedMessage('');

    try {
      // Re-check table status right before submission
      const statusRes = await fetch(`/api/table-status/${userId}/${tableNumber}`);
      const statusData = await statusRes.json();

      if (statusRes.ok && statusData.isOccupied) {
        // Table is locked, validate customer
        const normalize = (str) => (str || '').trim().toLowerCase();
        const isSameCustomer = 
          normalize(info.name) === normalize(statusData.customerInfo.name) &&
          normalize(info.phone) === normalize(statusData.customerInfo.phone);

        if (isSameCustomer) {
          // Correct customer, grant access
          setCustomerInfo(info);
          setCustomerInfoSubmitted(true);
          setOrderCustomerInfo(info);
          setShowCustomerModal(false);
        } else {
          // Wrong customer, deny access
          setAccessDeniedMessage('Access Denied. The customer details do not match the ongoing order. Please try again or contact staff.');
        }
      } else {
        // Table is not locked, proceed with new customer
        setCustomerInfo(info);
        setCustomerInfoSubmitted(true);
        setOrderCustomerInfo(info);
        setShowCustomerModal(false);
      }
    } catch (error) {
      console.error('Failed to verify table status on submit:', error);
      setAccessDeniedMessage('Could not verify table status. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
      size: sizeInfo,
      subcategory: item.subcategory || '' // Add subcategory field
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
        customerInfo={customerInfoSubmitted ? customerInfo : null}
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

      {/* Bottom Cart */}
      <BottomCart
        cart={cart}
        onViewCart={handleCartClick}
        isVisible={totalItemsCount > 0}
      />

      {/* Cart Panel */}
      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        orderMessage={orderMessage}
        setOrderMessage={setOrderMessage}
        onPlaceOrder={() => placeOrder(customerInfo)} // Update placeOrder call
        onClearCart={clearCart}
        onQuantityDecrease={decreaseQuantity}
        onQuantityIncrease={addToCart}
        onRemoveItem={removeFromCart}
        getTotalPrice={getTotalPrice}
        orderPlaced={orderPlaced}
        placingOrder={placingOrder}
        errorMessage={errorMessage}
        gstDetails={calculateGST(getTotalPrice())}
      />

      {/* My Orders Button */}
      <button
        onClick={() => setViewOrderModalOpen(true)}
        className="fixed bottom-5 left-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 
                 rounded-full shadow-lg transition-colors duration-200 z-30
                 focus:outline-none focus:ring-4 focus:ring-amber-300"
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

      {/* Customer Info Modal */}
      <CustomerInfoModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
        customerInfoSubmitted={customerInfoSubmitted}
        setCustomerInfoSubmitted={setCustomerInfoSubmitted}
        onSubmit={handleCustomerInfoSubmit}
        errorMessage={accessDeniedMessage}
      />
    </div>
  );
}
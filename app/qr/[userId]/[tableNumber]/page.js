"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import OrderViewer from "@/app/components/OrderViewer";
import { getAbly } from "@/lib/ably";

// QR Components
import MenuSearch from "@/app/components/qr/MenuSearch";
import MenuGrid from "@/app/components/qr/MenuGrid";
import BottomCart from "@/app/components/qr/BottomCart";
import CartPanel from "@/app/components/qr/CartPanel";
import CustomerInfoModal from "@/app/components/qr/CustomerInfoModal";
import SectionSidebar from "@/app/components/qr/CategorySidebar";

// Custom Hooks
import useCart from "@/app/hooks/useCart";
import useMenu from "@/app/hooks/useMenu";
import useQuantity from "@/app/hooks/useQuantity";
import useOrder from "@/app/hooks/useOrder";

export default function QRMenu(paramsPromise) {
  const { userId, tableNumber } = use(paramsPromise.params);
  const router = useRouter();
  
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
  const [businessType, setBusinessType] = useState('');
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState('All');

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerInfoSubmitted, setCustomerInfoSubmitted] = useState(false);
  const [isTableLocked, setTableLocked] = useState(false);
  const [originalCustomer, setOriginalCustomer] = useState(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  // Ably real-time subscription for redirect command
  useEffect(() => {
    if (!userId || !tableNumber || !customerInfoSubmitted) {
            return;
    }

    
    const ably = getAbly();
    const tableChannel = ably.channels.get(`table:${userId}:${tableNumber}`);

    // Log connection status
    ably.connection.on('connected', () => {
          });

    ably.connection.on('failed', (error) => {
          });

    const handleRedirectToBill = (message) => {
            const { orderId, tableNumber: eventTableNumber } = message.data;
      
      // Simple validation - check table number (convert both to strings for comparison)
      if (String(eventTableNumber) === String(tableNumber)) {
                        
        // Immediate redirect
        router.push(`/customer-bill/${orderId}`);
      } else {
              }
    };

        // Subscribe to redirect command
    tableChannel.subscribe('redirect-to-bill', handleRedirectToBill);

    return () => {
            tableChannel.unsubscribe('redirect-to-bill', handleRedirectToBill);
    };
  }, [userId, tableNumber, customerInfoSubmitted, router]);

  // Custom Hooks
  const {
    menu,
    filteredMenu: originalFilteredMenu,
    categories,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    loading: menuLoading
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

  // Filter menu based on active section
  const filteredMenu = useMemo(() => {
    let filtered = originalFilteredMenu;
    
    if (activeSection !== 'All') {
      filtered = filtered.filter(item => item.section === activeSection);
    }
    
    return filtered;
  }, [originalFilteredMenu, activeSection]);

  const subtotal = getTotalPrice();

  const gstDetails = useMemo(() => {
    const taxRate = businessInfo?.gstDetails?.taxRate || 0;
    const hasGstNumber = businessInfo?.gstDetails?.gstNumber && businessInfo.gstDetails.gstNumber.trim() !== '';
    
    let details = {
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
      details = {
        subtotal: subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalGst: totalTax,
        grandTotal: subtotal + totalTax,
        isGstApplicable: true,
        taxRate: taxRate
      };
    }

    return details;
  }, [subtotal, businessInfo]);

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
  } = useOrder(userId, tableNumber, cart, getTotalPrice, resetCart, gstDetails);

  const {
    itemQuantities,
    selectedSizes,
    incrementQuantity,
    decrementQuantity,
    resetQuantity,
    resetAllQuantities,
    handleSizeSelection,
    getQuantity,
    getSelectedSize,
    getPriceForSize
  } = useQuantity(apiStatus, orderPlaced);

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
        const response = await fetch(`/api/business/info?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBusinessInfo(data);
          setBusinessType(data.businessType || '');
        }
      } catch (error) {
              }
    };

    if (userId) {
      fetchBusinessInfo();
    }
  }, [userId]);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        console.log('Fetching sections...');
        const response = await fetch('/api/sections');
        if (response.ok) {
          const data = await response.json();
          console.log('Sections fetched:', data.sections);
          setSections(data.sections || []);
        } else {
          console.error('Failed to fetch sections:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
      }
    };

    fetchSections();
  }, []);

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
    <div className="h-[100vh] bg-gray-50 overflow-hidden">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">🥗</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">{hotelName}</h1>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-orange-100 rounded-lg border border-orange-200">
                    <p className="text-xs font-medium text-orange-700">Table {tableNumber}</p>
                  </div>
                </div>
              </div>
            </div>
            {customerInfoSubmitted && customerInfo && (
              <div className="text-right">
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">👤 {customerInfo.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <MenuSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        orderPlaced={orderPlaced}
      />

      {/* Main Layout with Sidebar */}
      <div className="flex h-screen">
        {/* Section Sidebar - Always Visible 20% width */}
        <SectionSidebar
          sections={sections}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          orderPlaced={orderPlaced}
          filteredMenu={originalFilteredMenu}
        />

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
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
            activeSection={activeSection}
          />
        </div>
      </div>

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
        onPlaceOrder={() => placeOrder(customerInfo)}
        onClearCart={clearCart}
        onQuantityDecrease={decreaseQuantity}
        onQuantityIncrease={addToCart}
        onRemoveItem={removeFromCart}
        getTotalPrice={getTotalPrice}
        orderPlaced={orderPlaced}
        placingOrder={placingOrder}
        errorMessage={errorMessage}
        gstDetails={gstDetails}
      />

      {/* My Orders Button */}
      <button
        onClick={() => setViewOrderModalOpen(true)}
        className="fixed bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 
                 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 z-30
                 focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-medium">My Orders</span>
        </div>
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
        businessType={businessType}
      />
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import { FaSearch, FaEdit, FaTrash, FaPrint, FaPlus, FaTimes } from 'react-icons/fa';
import { printBill } from '../components/bill/PrintBill';

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States
  const [menu, setMenu] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBillNumber, setSearchBillNumber] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [gstRate, setGstRate] = useState(0);
  const [todayTokenNumber, setTodayTokenNumber] = useState(1);
  const [allBills, setAllBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [showBillsHistory, setShowBillsHistory] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      if (!session?.user?.id) return;
      
      console.log('Fetching sections... User ID:', session.user.id);
      try {
        const response = await fetch('/api/sections');
        console.log('Sections response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to fetch sections');
        }
        const data = await response.json();
        console.log('Sections response data:', data);
        
        if (data.sections && Array.isArray(data.sections)) {
          console.log('Sections loaded:', data.sections);
          setSections(data.sections);
        } else {
          console.error('Unexpected sections data format:', data);
          setSections([]);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
      }
    };
    if (session?.user?.id) {
      fetchSections();
    }
  }, [session]);

  // Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      if (!session?.user?.id) return;
      
      console.log('Fetching menu... User ID:', session.user.id);
      try {
        const response = await fetch(`/api/menu?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Menu fetched successfully:', data.length, 'items');
          if (Array.isArray(data)) {
            console.log('Menu items loaded (array):', data);
            setMenu(data);
          } else if (data.items && Array.isArray(data.items)) {
            console.log('Menu items loaded (object.items):', data.items);
            setMenu(data.items);
          } else {
            console.error('Unexpected menu data format:', data);
            setMenu([]);
          }
        } else {
          console.error('Failed to fetch menu:', response.status);
          console.error('Unexpected menu data format:', data);
          setMenu([]);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [session]);

  // Fetch business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/business/info?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setBusinessInfo(data);
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

  // Fetch today's bills and token number
  useEffect(() => {
    const fetchTodaysBills = async () => {
      if (!session?.user?.id) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/bills/today?userId=${session.user.id}&date=${today}`);
        if (response.ok) {
          const data = await response.json();
          setBills(data.bills || []);
          setTodayTokenNumber(data.nextTokenNumber || 1);
        }
      } catch (error) {
        console.error('Error fetching today\'s bills:', error);
      }
    };

    fetchTodaysBills();
  }, [session]);

  // Filter menu items by section
  const filteredMenu = menu.filter(item => {
    if (selectedSection === 'all') return true;
    return item.section === selectedSection;
  });

  // Get sections with counts
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

  // Add item to cart
  const addToCart = (item, selectedSizeIndex = 0) => {
    const hasMultipleSizes = item.pricing && item.pricing.length > 1;
    const selectedPrice = hasMultipleSizes 
      ? item.pricing[selectedSizeIndex].price 
      : item.price;
    
    const selectedSize = hasMultipleSizes 
      ? item.pricing[selectedSizeIndex].size 
      : 'Regular';

    const cartItem = {
      _id: item._id,
      name: item.name,
      price: selectedPrice,
      selectedSize,
      quantity: 1,
      category: item.category
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => 
        cartItem._id === item._id && cartItem.selectedSize === selectedSize
      );
      
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem._id === item._id && cartItem.selectedSize === selectedSize
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, cartItem];
      }
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (itemId, selectedSize, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, selectedSize);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item._id === itemId && item.selectedSize === selectedSize
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId, selectedSize) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item._id === itemId && item.selectedSize === selectedSize)
      )
    );
  };

  // Calculate totals
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const calculateGST = () => cartTotal * (gstRate / 100);
  const finalTotal = cartTotal + calculateGST();

  // Search bill by number
  const searchBill = async () => {
    if (!searchBillNumber.trim()) {
      toast.error('Please enter a bill number');
      return;
    }

    try {
      const response = await fetch(`/api/bills/search?billNumber=${searchBillNumber}&userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.bill) {
          setSelectedBill(data.bill);
          // Handle new bill structure
          const billItems = data.bill.items || [];
          setCart(billItems.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            selectedSize: item.selectedSize || 'Regular',
            quantity: item.quantity || 1,
            category: item.category
          })));
          setCustomerName(data.bill.customerInfo?.name || data.bill.customerName || '');
          setCustomerPhone(data.bill.customerInfo?.phone || data.bill.customerPhone || '');
        } else {
          toast.error('Bill not found');
        }
      } else {
        toast.error('Bill not found');
      }
    } catch (error) {
      console.error('Error searching bill:', error);
      toast.error('Error searching bill');
    }
  };

  // Create new bill
  const createBill = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    try {
      const billData = {
        tokenNumber: todayTokenNumber,
        items: cart,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        subtotal: cartTotal,
        gst: calculateGST(),
        total: finalTotal,
        userId: session.user.id
      };

      const response = await fetch('/api/bills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bill and Order created:', data);
        
        // Print bill with proper format
        const printData = {
          orderNumber: data.bill.billNumber,
          billNumber: data.bill.billNumber,
          tokenNumber: data.bill.tokenNumber,
          customerName: customerName.trim() || 'Walk-in Customer',
          customerPhone: customerPhone.trim(),
          date: new Date().toLocaleString('en-IN'),
          items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.selectedSize || 'Regular'
          })),
          subtotal: cartTotal,
          gst: calculateGST(),
          total: finalTotal
        };

        console.log('Printing bill with data:', printData);
        try {
          await printBill(`Token #${data.bill.tokenNumber}`, cart, session, printData);
          console.log('Bill printed successfully');
        } catch (printError) {
          console.error('Print error:', printError);
          toast.error('Bill created but print failed. Check console for details.');
        }
        
        // Clear form
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedBill(null);
        setIsEditMode(false);
        setTodayTokenNumber(prev => prev + 1);
        
        toast.success(`Bill & Order created successfully! Token #${data.bill.tokenNumber}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  // Update existing bill
  const updateBill = async () => {
    if (!selectedBill || cart.length === 0) {
      toast.error('No bill selected or cart is empty');
      return;
    }

    try {
      const billData = {
        items: cart,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        subtotal: cartTotal,
        gst: calculateGST(),
        total: finalTotal
      };

      const response = await fetch(`/api/bills/update/${selectedBill._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (response.ok) {
        toast.success('Bill updated successfully!');
        setIsEditMode(false);
      } else {
        toast.error('Failed to update bill');
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    }
  };

  // Delete bill
  const deleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const response = await fetch(`/api/bills/delete/${billId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBills(prev => prev.filter(bill => bill._id !== billId));
        if (selectedBill && selectedBill._id === billId) {
          setSelectedBill(null);
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setIsEditMode(false);
        }
        toast.success('Bill deleted successfully!');
      } else {
        toast.error('Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  // Test print function
  const testPrint = async () => {
    if (cart.length === 0) {
      toast.error('Add some items to test print');
      return;
    }

    const testPrintData = {
      orderNumber: 'TEST-001',
      billNumber: 'TEST-001',
      tokenNumber: 999,
      customerName: customerName.trim() || 'Test Customer',
      customerPhone: customerPhone.trim() || '1234567890',
      date: new Date().toLocaleString('en-IN'),
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.selectedSize || 'Regular'
      })),
      subtotal: cartTotal,
      gst: calculateGST(),
      total: finalTotal
    };

    console.log('Test printing with data:', testPrintData);
    try {
      await printBill('Test Token #999', cart, session, testPrintData);
      toast.success('Test print successful!');
    } catch (error) {
      console.error('Test print error:', error);
      toast.error('Test print failed. Check console for details.');
    }
  };

  // Fetch all bills
  const fetchAllBills = async () => {
    setBillsLoading(true);
    try {
      const response = await fetch('/api/bills/all?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAllBills(data.bills || []);
      } else {
        toast.error('Failed to fetch bills history');
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Error fetching bills history');
    } finally {
      setBillsLoading(false);
    }
  };

  // Load bill from history
  const loadBillFromHistory = (bill) => {
    setSelectedBill(bill);
    const billItems = bill.items || [];
    setCart(billItems.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      selectedSize: item.selectedSize || 'Regular',
      quantity: item.quantity || 1,
      category: item.category
    })));
    setCustomerName(bill.customerInfo?.name || '');
    setCustomerPhone(bill.customerInfo?.phone || '');
    setShowBillsHistory(false);
    toast.success(`Loaded bill #${bill.billNumber}`);
  };

  // Cleanup duplicate bills
  const cleanupBills = async () => {
    try {
      const response = await fetch('/api/bills/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Refresh bills history
        if (showBillsHistory) {
          fetchAllBills();
        }
      } else {
        toast.error('Failed to cleanup bills');
      }
    } catch (error) {
      console.error('Error cleaning up bills:', error);
      toast.error('Error cleaning up bills');
    }
  };

  // Clear form
  const clearForm = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedBill(null);
    setIsEditMode(false);
    setSearchBillNumber('');
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing page...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No session found. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-2 py-20">
        <div className="flex gap-3 h-[calc(100vh-5rem)]">
          {/* Left Sidebar - Sections */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full overflow-y-auto">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📂</span>
                <span>Sections ({sectionsWithCounts.length})</span>
              </h3>
              
              {sectionsWithCounts.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No sections available</p>
                  <p className="text-xs text-gray-400 mt-1">Add sections from Menu page</p>
                </div>
              )}
              
              <div className="space-y-1">
                {sectionsWithCounts.map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setSelectedSection(section.name)}
                    className={`w-full text-left px-2 py-2 rounded-md transition-colors flex items-center justify-between ${
                      selectedSection === section.name
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {section.name === "all" ? "📋" : section.icon || "📂"}
                      </span>
                      <span className="font-medium text-sm">
                        {section.displayName || section.name}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedSection === section.name
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {section.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle - Menu Items */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-3 h-full overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                Menu Items 
                <span className="text-xs text-gray-500 ml-2">
                  ({menu.length} total, {filteredMenu.length} filtered)
                </span>
              </h2>
              
              {/* Debug Info */}
              {!loading && menu.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No menu items found.</p>
                  <p className="text-sm text-gray-400 mt-2">Please add items from Menu page first.</p>
                </div>
              )}
              
              {/* Menu Items Grid */}
              {filteredMenu.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {filteredMenu.map(item => (
                    <div key={item._id} className="bg-gray-50 rounded-md p-2 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-800 text-xs leading-tight">{item.name}</h3>
                        <div className={`w-3 h-3 rounded-full ${
                          item.category === 'veg' ? 'bg-green-500' : 
                          item.category === 'non-veg' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                      
                      {item.pricing && item.pricing.length > 1 ? (
                        <div className="space-y-0.5">
                          {item.pricing.map((size, index) => (
                            <button
                              key={index}
                              onClick={() => addToCart(item, index)}
                              className="w-full text-left px-1.5 py-0.5 text-xs border rounded hover:bg-blue-50 hover:border-blue-200 flex justify-between"
                            >
                              <span>{size.size}</span>
                              <span>₹{size.price}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full mt-1 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Add - ₹{item.price}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items match the current filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Billing Area */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
              {/* Header - Fixed */}
              <div className="flex-shrink-0 p-3 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Billing</h2>
                  <div className="text-xs text-gray-600">
                    Token #{todayTokenNumber}
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* Bill Search */}
                <div className="mb-3">
                  <div className="flex gap-1 mb-2">
                  <input
                    type="text"
                    placeholder="Enter bill number..."
                    value={searchBillNumber}
                    onChange={(e) => setSearchBillNumber(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchBill()}
                  />
                  <button
                    onClick={searchBill}
                    className="px-2 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <FaSearch className="text-xs" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowBillsHistory(!showBillsHistory);
                    if (!showBillsHistory && allBills.length === 0) {
                      fetchAllBills();
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {showBillsHistory ? 'Hide' : 'Show'} Bills History
                </button>
              </div>

              {/* Bills History */}
              {showBillsHistory && (
                <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="p-3 bg-gray-50 border-b">
                    <h4 className="font-medium text-gray-800">Recent Bills</h4>
                  </div>
                  {billsLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : allBills.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No bills found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {allBills.map((bill) => (
                        <div key={bill._id} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => loadBillFromHistory(bill)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">#{bill.billNumber}</p>
                              <p className="text-xs text-gray-600">Token #{bill.tokenNumber}</p>
                              <p className="text-xs text-gray-500">{bill.customerInfo?.name || 'Walk-in'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">₹{bill.pricing?.total || bill.total}</p>
                              <p className="text-xs text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBill(bill._id);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs mt-1"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Details */}
              <div className="mb-3 space-y-1">
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Customer Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Cart Items */}
              <div className="mb-3">
                <h3 className="font-medium text-gray-800 mb-2 text-sm">Order Items</h3>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-3">No items added</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={`${item._id}-${item.selectedSize}`} className="flex items-center justify-between bg-gray-50 p-1.5 rounded">
                        <div className="flex-1">
                          <p className="text-xs font-medium leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.selectedSize} - ₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCartQuantity(item._id, item.selectedSize, item.quantity - 1)}
                            className="w-5 h-5 bg-gray-200 rounded text-xs hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="text-xs w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item._id, item.selectedSize, item.quantity + 1)}
                            className="w-5 h-5 bg-gray-200 rounded text-xs hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item._id, item.selectedSize)}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Summary */}
              {cart.length > 0 && (
                <div className="border-t pt-3 mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 text-xs">Subtotal</span>
                    <span className="text-xs">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 text-xs">GST ({gstRate}%)</span>
                      <span className="text-xs">₹{calculateGST().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

                {/* Selected Bill Info */}
                {selectedBill && (
                  <div className="mt-3 p-2 bg-blue-50 rounded">
                    <p className="text-xs font-medium text-blue-800">
                      Bill #{selectedBill.billNumber} | Token #{selectedBill.tokenNumber}
                    </p>
                    <p className="text-xs text-blue-600">
                      {new Date(selectedBill.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t bg-gray-50 p-2">
                <div className="grid grid-cols-2 gap-1 mb-1">
                  {/* Primary Actions */}
                  {selectedBill && isEditMode ? (
                    <>
                      <button
                        onClick={updateBill}
                        disabled={cart.length === 0}
                        className="py-1.5 px-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                      >
                        <FaEdit className="text-xs" />
                        Update
                      </button>
                      <button
                        onClick={() => deleteBill(selectedBill._id)}
                        className="py-1.5 px-2 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <FaTrash className="text-xs" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={createBill}
                        disabled={cart.length === 0}
                        className="py-1.5 px-2 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                      >
                        <FaPrint className="text-xs" />
                        Create Bill
                      </button>
                      {selectedBill && !isEditMode && (
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="py-1.5 px-2 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <FaEdit className="text-xs" />
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={testPrint}
                    disabled={cart.length === 0}
                    className="py-1 px-1 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                  >
                    <FaPrint className="text-xs" />
                    Test
                  </button>
                  
                  <button
                    onClick={clearForm}
                    className="py-1 px-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                  
                  <button
                    onClick={cleanupBills}
                    className="py-1 px-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                  >
                    🧹 Fix
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

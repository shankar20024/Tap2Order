"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { 
  FaTable, 
  FaTimesCircle, 
  FaClipboardList, 
  FaUsers,
  FaPrint,
  FaRupeeSign,
  FaCrown,
  FaCheckCircle
} from "react-icons/fa";

// TableDetailsModal - Professional ultra responsive modal with premium design
const TableDetailsModal = ({ tableNumber, orders, onClose, onPrint, onMarkPaid, userProfile }) => {
  const { data: session } = useSession();
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            setBusinessInfo(data);
          } else {
            setBusinessInfo(userProfile);
          }
        } catch (error) {
          setBusinessInfo(userProfile);
        }
      } else {
        setBusinessInfo(userProfile);
      }
    };
    fetchBusinessInfo();
  }, [session, userProfile]);

  // Calculate subtotal from orders
  const subTotal = orders.reduce((sum, order) => {
    return sum + (order.items || order.cart || []).reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const hasPaidOrders = orders.some(order => order.billPaid || order.isPaid || order.paid);
  
  // GST Calculation using useMemo
  const gstDetails = useMemo(() => {
    const currentSubTotal = orders.reduce((sum, order) => {
      return sum + (order.items || order.cart || []).reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);

    const taxRate = businessInfo?.gstDetails?.taxRate || 0;
    const hasGstNumber = businessInfo?.gstDetails?.gstNumber && businessInfo.gstDetails.gstNumber.trim() !== '';
    
    let gstCalc = {
      subtotal: currentSubTotal,
      cgstAmount: 0,
      sgstAmount: 0,
      totalGst: 0,
      grandTotal: currentSubTotal,
      isGstApplicable: false,
      taxRate: taxRate
    };

    if (hasGstNumber && taxRate > 0) {
      const totalTax = currentSubTotal * (taxRate / 100);
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      
      gstCalc = {
        subtotal: currentSubTotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalGst: totalTax,
        grandTotal: currentSubTotal + totalTax,
        isGstApplicable: true,
        taxRate: taxRate
      };
    }
    
    return gstCalc;
  }, [businessInfo, orders]);

  // Calculate item-wise status counts
  const itemStatusCounts = orders.reduce((counts, order) => {
    const items = order.items || order.cart || [];
    items.forEach(item => {
      const status = item.status || order.status || 'pending';
      const quantity = item.quantity || 1;
      counts[status] = (counts[status] || 0) + quantity;
    });
    return counts;
  }, {});

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 md:p-6">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl lg:rounded-[2rem] shadow-2xl shadow-black/20 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] lg:max-h-[80vh] overflow-hidden border border-white/20 flex flex-col relative">
        
        {/* Premium Header with Glass Morphism */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-3 sm:p-4 md:p-5 lg:p-6 relative overflow-hidden flex-shrink-0">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10"></div>
          
          <div className="relative z-10">
            {/* Professional Header Layout */}
            <div className="flex items-start justify-between mb-4 sm:mb-5">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
                  <FaTable className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Table {tableNumber}
                    </h2>
                    <FaCrown className="text-yellow-400 text-sm sm:text-base animate-pulse" />
                  </div>
                  <p className="text-blue-200/80 text-xs sm:text-sm font-medium hidden sm:block">Premium Order Management</p>
                  {/* Customer info with premium styling */}
                  {orders.length > 0 && orders[0].customerInfo?.name && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-blue-100/90 text-xs sm:text-sm font-medium truncate">
                        <span className="hidden sm:inline">Customer: </span>
                        {orders[0].customerInfo.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl transform hover:scale-110 flex-shrink-0 ml-3"
              >
                <FaTimesCircle className="text-lg sm:text-xl md:text-2xl text-red-300 hover:text-red-200" />
              </button>
            </div>
            
            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Items Count Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {orders.reduce((total, order) => {
                      return total + (order.items || order.cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                    }, 0)}
                  </div>
                  <div className="text-blue-200/80 text-xs sm:text-sm font-medium">Total Items</div>
                </div>
              </div>

              {/* Amount Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-300 mb-1">
                    ₹{(gstDetails.isGstApplicable ? gstDetails.grandTotal : subTotal).toLocaleString('en-IN')}
                  </div>
                  <div className="text-blue-200/80 text-xs sm:text-sm font-medium">Grand Total</div>
                </div>
              </div>

              {/* Status Overview Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 sm:col-span-1 col-span-1">
                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                  {itemStatusCounts.pending > 0 && (
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Pending: </span>{itemStatusCounts.pending}
                    </span>
                  )}
                  {itemStatusCounts.preparing > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Preparing: </span>{itemStatusCounts.preparing}
                    </span>
                  )}
                  {itemStatusCounts.ready > 0 && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Ready: </span>{itemStatusCounts.ready}
                    </span>
                  )}
                  {itemStatusCounts.served > 0 && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Served: </span>{itemStatusCounts.served}
                    </span>
                  )}
                  {itemStatusCounts.completed > 0 && (
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Done: </span>{itemStatusCounts.completed}
                    </span>
                  )}
                </div>
                <div className="text-blue-200/80 text-xs sm:text-sm font-medium text-center mt-2">Order Status</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premium Content Area */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex-1 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.3%22%3E%3Cpath%20d%3D%22M20%2020c0%2011.046-8.954%2020-20%2020v20h40V20H20z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          {orders.length === 0 ? (
            <div className="text-center py-12 sm:py-16 relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaClipboardList className="text-3xl sm:text-4xl text-slate-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2">No Active Orders</h3>
              <p className="text-slate-500 text-sm sm:text-base hidden sm:block">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-white/50 shadow-xl shadow-slate-200/50 relative z-10">
              
              {/* Premium Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <FaClipboardList className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Order Details</h3>
                </div>
                {orders[0]?.customerInfo?.name && (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 py-2 rounded-full border border-blue-200/50 shadow-sm">
                    <FaUsers className="text-blue-600 text-sm" />
                    <span className="text-sm sm:text-base font-medium text-slate-700 truncate max-w-[150px] sm:max-w-none">
                      {orders[0].customerInfo.name}
                    </span>
                    {orders[0].customerInfo?.phone && (
                      <span className="text-slate-500 text-sm hidden sm:inline">• {orders[0].customerInfo.phone}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Premium Items List */}
              <div className="space-y-3 sm:space-y-4">
                {orders.map((order, orderIdx) => 
                  (order.items || order.cart || []).map((item, itemIdx) => (
                    <div key={`${orderIdx}-${itemIdx}`} className="group bg-gradient-to-r from-white to-slate-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/50 hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                      
                      {/* Premium Item Layout */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                        
                        {/* Item Information */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <span className="font-semibold text-slate-800 text-sm sm:text-base truncate group-hover:text-blue-700 transition-colors">
                            {item.name}
                          </span>
                          <span className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                            ×{item.quantity}
                          </span>
                          {item.size && (
                            <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2 py-1 rounded-full text-xs sm:text-sm font-medium border border-blue-200/50">
                              {item.size}
                            </span>
                          )}
                          <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm border ${
                            (item.status || order.status) === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200' :
                            (item.status || order.status) === 'preparing' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200' :
                            (item.status || order.status) === 'ready' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' : 
                            'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200'
                          }`}>
                            <FaCheckCircle className="inline mr-1 text-xs" />
                            {item.status || order.status}
                          </div>
                        </div>
                        
                        {/* Premium Price Display */}
                        <div className="flex items-center space-x-2 self-start sm:self-center">
                          <span className="font-bold text-slate-900 text-base sm:text-lg bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-lg border border-green-200/50 shadow-sm">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Premium Special Instructions */}
              {orders.some(order => order.message || order.specialInstructions) && (
                <div className="mt-4 sm:mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-amber-800">Special Instructions</p>
                  </div>
                  {orders.filter(order => order.message || order.specialInstructions).map((order, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-amber-700 ml-8 font-medium">
                      • {order.message || order.specialInstructions}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Premium GST Summary */}
              <div className="mt-4 sm:mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <FaRupeeSign className="text-white text-sm" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800">Bill Summary</h4>
                </div>
                
                {/* Premium GST Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                      <span className="text-sm sm:text-base text-slate-600 font-medium mb-1 sm:mb-0">Total Quantity:</span>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        {orders.reduce((total, order) => {
                          return total + (order.items || order.cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                        }, 0)} items
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                      <span className="text-sm sm:text-base text-slate-600 font-medium">Subtotal:</span>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        ₹{gstDetails.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                      <span className="text-sm sm:text-base text-slate-600 font-medium">CGST ({gstDetails.taxRate / 2}%):</span>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        ₹{gstDetails.cgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                      <span className="text-sm sm:text-base text-slate-600 font-medium">SGST ({gstDetails.taxRate / 2}%):</span>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        ₹{gstDetails.sgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-blue-300/30 mt-4 pt-4 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
                      <FaCrown className="text-yellow-500" />
                      <span>Grand Total:</span>
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600 bg-white px-4 py-2 rounded-xl shadow-lg border border-blue-200">
                      ₹{gstDetails.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 px-4 sm:px-5 md:px-6 py-4 sm:py-5 border-t border-slate-200/50 flex-shrink-0 relative">
          {/* Premium Footer Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 relative z-10">
            
            {/* Premium Total Display */}
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                <span className="text-sm sm:text-base text-slate-600 font-medium mb-1 sm:mb-0">Final Amount:</span>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl shadow-xl border border-green-400/50 transform hover:scale-105 transition-all duration-300">
                  <span className="font-bold text-lg sm:text-xl">
                    ₹{(gstDetails.isGstApplicable ? gstDetails.grandTotal : subTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Premium Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={onPrint} 
                className="group bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 min-h-[48px] border border-green-400/30"
              >
                <FaPrint className="text-sm sm:text-base group-hover:animate-bounce" />
                <span className="text-sm sm:text-base">Print Bill</span>
              </button>
              <button 
                onClick={() => onMarkPaid(gstDetails)} 
                className="group bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 min-h-[48px] border border-blue-400/30"
              >
                <FaRupeeSign className="text-sm sm:text-base group-hover:animate-pulse" />
                <span className="text-sm sm:text-base">Mark Paid</span>
              </button>
              <button 
                onClick={onClose} 
                className="group bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 min-h-[48px] border border-slate-400/30 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDetailsModal;

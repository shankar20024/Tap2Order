"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { 
  FaTable, 
  FaTimesCircle, 
  FaClipboardList, 
  FaUsers,
  FaPrint,
  FaRupeeSign
} from "react-icons/fa";

// TableDetailsModal - shows detailed orders for a table
const TableDetailsModal = ({ tableNumber, orders, onClose, onPrint, onMarkPaid, userProfile }) => {
  const { data: session } = useSession();
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (session?.user?.id) {
        try {
          // The /api/profile uses getServerSession, so no Authorization header needed
          const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for session cookies
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
    // Always calculate from items to get the true subtotal before any taxes
    return sum + (order.items || order.cart || []).reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const hasPaidOrders = orders.some(order => order.billPaid || order.isPaid || order.paid);
  
  // GST Calculation using useMemo to recalculate when businessInfo changes
  const gstDetails = useMemo(() => {
    // Recalculate subtotal here to ensure it's always fresh within this memo
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

    // Apply GST only if user has GST number and tax rate > 0
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-gray-200 flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FaTable className="text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Table {tableNumber}</h2>
                  <p className="text-blue-100 text-sm">Order Management</p>
                  {/* Show customer names if available */}
                  {orders.length > 0 && orders[0].customerInfo?.name && (
                    <p className="text-blue-200 text-sm font-medium">Customer: {orders[0].customerInfo.name}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            {/* Stats Row */}
            <div className="mt-4 flex items-center justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-bold">{orders.reduce((total, order) => {
                  return total + (order.items || order.cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                }, 0)}</div>
                <div className="text-blue-100 text-sm">Items</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">₹{(gstDetails.isGstApplicable ? gstDetails.grandTotal : subTotal).toLocaleString('en-IN')}</div>
                <div className="text-blue-100 text-sm">Total Amount</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="flex flex-wrap gap-2 justify-center">
                  {itemStatusCounts.pending > 0 && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Pending: {itemStatusCounts.pending}
                    </span>
                  )}
                  {itemStatusCounts.preparing > 0 && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Preparing: {itemStatusCounts.preparing}
                    </span>
                  )}
                  {itemStatusCounts.ready > 0 && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Ready: {itemStatusCounts.ready}
                    </span>
                  )}
                  {itemStatusCounts.served > 0 && (
                    <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Served: {itemStatusCounts.served}
                    </span>
                  )}
                  {itemStatusCounts.completed > 0 && (
                    <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Completed: {itemStatusCounts.completed}
                    </span>
                  )}
                </div>
                <div className="text-blue-100 text-sm mt-1">Item Status</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders Content */}
        <div className="p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 flex-1">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClipboardList className="text-3xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No active orders for this table</p>
              <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
                {/* Display customer info if available */}
                {orders[0]?.customerInfo?.name && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                    <FaUsers className="inline mr-1" />
                    {orders[0].customerInfo.name}
                    {orders[0].customerInfo?.phone && (
                      <span className="ml-2 text-gray-500">• {orders[0].customerInfo.phone}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {orders.map((order, orderIdx) => 
                  (order.items || order.cart || []).map((item, itemIdx) => (
                    <div key={`${orderIdx}-${itemIdx}`} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="text-sm text-gray-600">×{item.quantity}</span>
                        {item.size && (
                          <span className="text-sm text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{item.size}</span>
                        )}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (item.status || order.status) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          (item.status || order.status) === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          (item.status || order.status) === 'ready' ? 'bg-green-100 text-green-700' : 
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {item.status || order.status}
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Special Instructions if any */}
              {orders.some(order => order.message || order.specialInstructions) && (
                <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-1">Special Instructions:</p>
                  {orders.filter(order => order.message || order.specialInstructions).map((order, idx) => (
                    <p key={idx} className="text-sm text-amber-700">• {order.message || order.specialInstructions}</p>
                  ))}
                </div>
              )}
              
              {/* GST Summary Card */}
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FaRupeeSign className="text-blue-600 mr-2" />
                  Bill Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Qty:</span>
                      <span className="font-medium text-gray-800">
                        {orders.reduce((total, order) => {
                          return total + (order.items || order.cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                        }, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sub Total:</span>
                      <span className="font-medium text-gray-800">
                        ₹{gstDetails.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CGST ({gstDetails.taxRate / 2}%):</span>
                      <span className="font-medium text-gray-800">
                        ₹{gstDetails.cgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SGST ({gstDetails.taxRate / 2}%):</span>
                      <span className="font-medium text-gray-800">
                        ₹{gstDetails.sgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-blue-200 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{gstDetails.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              <div>
                <span className="text-sm">Total Amount: </span>
                <span className="font-bold text-xl text-gray-900 bg-white px-4 py-2 rounded-xl shadow-sm border">
                  ₹{(gstDetails.isGstApplicable ? gstDetails.grandTotal : subTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onPrint} 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <FaPrint className="text-sm" />
                <span>Print Bill</span>
              </button>
              <button 
                onClick={() => onMarkPaid(gstDetails)} 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <FaRupeeSign className="text-sm" />
                <span>Mark Paid</span>
              </button>
              <button 
                onClick={onClose} 
                className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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

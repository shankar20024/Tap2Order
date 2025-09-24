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
import { getBusinessInfo } from "@/lib/businessInfoCache";

const TableDetailsModal = ({ tableNumber, orders, onClose, onPrint, onMarkPaid, userProfile }) => {
  const { data: session } = useSession();
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (session?.user?.id) {
        try {
          const cachedBusinessInfo = await getBusinessInfo(session.user.id);
          if (cachedBusinessInfo) {
            setBusinessInfo(cachedBusinessInfo);
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

  // Subtotal
  const subTotal = orders.reduce((sum, order) => {
    return sum + (order.items || order.cart || []).reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const hasPaidOrders = orders.some(order => order.billPaid || order.isPaid || order.paid);
  
  // GST Calc
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

  // Item Status
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
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl lg:rounded-[2rem] shadow-2xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[95vh] overflow-hidden border border-white/20 flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-5 relative flex-shrink-0">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
                  <FaTable className="text-lg text-blue-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-2xl font-bold truncate bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Table {tableNumber}
                    </h2>
                    <FaCrown className="text-yellow-400 text-sm animate-pulse" />
                  </div>
                  {orders.length > 0 && orders[0].customerInfo?.name && (
                    <p className="text-blue-200/80 text-xs sm:text-sm truncate">
                      {orders[0].customerInfo.name}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
              >
                <FaTimesCircle className="text-xl text-red-300 hover:text-red-200" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex-1 relative">
          {orders.length === 0 ? (
            <div className="text-center py-12 relative z-10">
              <FaClipboardList className="mx-auto text-4xl text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Active Orders</h3>
              <p className="text-slate-500 text-sm">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="bg-white/80 rounded-2xl p-4 border border-slate-200 relative z-10">
              
              {/* Order Details Header */}
              <div className="flex items-center space-x-3 mb-4">
                <FaClipboardList className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Order Details</h3>
              </div>
              
              {/* 🔥 Compact Items List */}
              <div className="divide-y divide-slate-200">
                {orders.map((order, orderIdx) =>
                  (order.items || order.cart || []).map((item, itemIdx) => {
                    const status = item.status || order.status || 'pending';
                    return (
                      <div 
                        key={`${orderIdx}-${itemIdx}`} 
                        className="flex justify-between items-center py-2 px-2 hover:bg-slate-50 transition-all"
                      >
                        {/* Left: name, qty, status */}
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-sm sm:text-base truncate">
                            {item.name}{item.size ? ` (${item.size})` : ''} ×{item.quantity}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500">
                            <span 
                              className={`w-2 h-2 rounded-full ${
                                status === 'pending' ? 'bg-yellow-500' :
                                status === 'preparing' ? 'bg-blue-500' :
                                status === 'ready' ? 'bg-green-500' :
                                status === 'served' ? 'bg-purple-500' :
                                'bg-emerald-500'
                              }`} 
                            ></span>
                            {status}
                          </div>
                        </div>
                        {/* Right: price */}
                        <span className="font-semibold text-slate-900 text-sm sm:text-base bg-slate-100 px-2 py-1 rounded-md">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Special Instructions */}
              {orders.some(order => order.message || order.specialInstructions) && (
                <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-3">
                  <p className="text-sm font-bold text-amber-800 mb-1">Special Instructions</p>
                  {orders.filter(order => order.message || order.specialInstructions).map((order, idx) => (
                    <p key={idx} className="text-xs text-amber-700 ml-2">• {order.message || order.specialInstructions}</p>
                  ))}
                </div>
              )}
              
              {/* Bill Summary */}
              <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <FaRupeeSign /> Bill Summary
                </h4>
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{gstDetails.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {gstDetails.isGstApplicable && (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CGST ({gstDetails.taxRate/2}%):</span>
                      <span className="font-semibold">₹{gstDetails.cgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>SGST ({gstDetails.taxRate/2}%):</span>
                      <span className="font-semibold">₹{gstDetails.sgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-base font-bold">Grand Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{gstDetails.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 px-4 py-4 border-t flex-shrink-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Final Amount */}
            <div className="text-center sm:text-left">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-md">
                <span className="font-bold text-lg">
                  ₹{(gstDetails.isGstApplicable ? gstDetails.grandTotal : subTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onPrint} 
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center gap-2 justify-center"
              >
                <FaPrint /> Print Bill
              </button>
              <button 
                onClick={() => onMarkPaid(gstDetails)} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center gap-2 justify-center"
              >
                <FaRupeeSign />Paid
              </button>
              <button 
                onClick={onClose} 
                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-3 rounded-xl shadow-md"
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

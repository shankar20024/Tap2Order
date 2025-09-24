'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaDownload, FaReceipt, FaCheckCircle, FaPrint } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function CustomerBillPage() {
  const { orderId } = useParams();
  const [billData, setBillData] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchBillData();
    }
  }, [orderId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const orderResponse = await fetch(`/api/order/${orderId}`);
      if (!orderResponse.ok) throw new Error('Order not found');
      const orderData = await orderResponse.json();
      
      // Fetch business info
      const businessResponse = await fetch(`/api/business/info?userId=${orderData.userId}`);
      const businessData = await businessResponse.json();
      
      setBillData(orderData);
      setBusinessInfo(businessData);
    } catch (error) {
      console.error('Error fetching bill data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBill = () => {
    window.print();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const { street, city, state, zipCode,  } = address;
    return [street, city, state, zipCode, ].filter(Boolean).join(', ');
  };

  const calculateGST = () => {
    if (!billData?.gstDetails?.isGstApplicable) return null;
    
    const subtotal = billData.totalAmount;
    const taxRate = businessInfo?.gstDetails?.taxRate || 0;
    const totalTax = subtotal * (taxRate / 100);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const grandTotal = subtotal + totalTax;
    
    return {
      subtotal,
      cgst,
      sgst,
      totalTax,
      grandTotal,
      taxRate
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bill...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Bill Not Found</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const gstData = calculateGST();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Payment Successful!</h1>
                <p className="text-gray-600">Your digital receipt is ready</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadBill}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaDownload className="text-sm" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Content */}
      <div className="max-w-2xl mx-auto p-4 print:p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none"
        >
          {/* Receipt Header */}
          <div className="p-6 text-center border-b print:border-b-2 print:border-dashed">
            <FaReceipt className="text-4xl text-blue-600 mx-auto mb-3 print:hidden" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {businessInfo?.businessName || 'Restaurant'}
            </h1>
            <p className="text-gray-600 mb-1">{businessInfo?.phone}</p>
            <p className="text-gray-600 mb-1">{formatAddress(businessInfo?.address)}</p>
            {businessInfo?.email && (
              <p className="text-gray-600 mb-1">Email: {businessInfo.email}</p>
            )}
            {businessInfo?.gstDetails?.gstNumber && (
              <p className="text-gray-600 mb-1">GST: {businessInfo.gstDetails.gstNumber}</p>
            )}
            {businessInfo?.fssaiDetails?.fssaiNumber && (
              <p className="text-gray-600">FSSAI: {businessInfo.fssaiDetails.fssaiNumber}</p>
            )}
          </div>

          {/* Bill Details */}
          <div className="p-6 border-b print:border-b-2 print:border-dashed">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Bill No:</p>
                <p className="text-gray-600">{billData.billNumber || `#${billData._id.slice(-6)}`}</p>
              </div>
              <div>
                <p className="font-semibold">Date & Time:</p>
                <p className="text-gray-600">{formatDate(billData.createdAt)}</p>
              </div>
              <div>
                <p className="font-semibold">Table No:</p>
                <p className="text-gray-600">{billData.tableNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Customer:</p>
                <p className="text-gray-600">{billData.customerInfo?.name || 'Walk-in Customer'}</p>
              </div>
            </div>
            {billData.customerInfo?.phone && (
              <div className="mt-2">
                <p className="font-semibold text-sm">Phone:</p>
                <p className="text-gray-600 text-sm">{billData.customerInfo.phone}</p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="p-6 border-b print:border-b-2 print:border-dashed">
            <h3 className="font-bold text-lg mb-4">Order Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between font-semibold text-sm border-b pb-2">
                <span>Item</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              {billData.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.size && <p className="text-gray-500 text-xs">Size: {item.size}</p>}
                    {item.specialInstructions && (
                      <p className="text-gray-500 text-xs">Note: {item.specialInstructions}</p>
                    )}
                  </div>
                  <div className="w-12 text-center">{item.quantity}</div>
                  <div className="w-20 text-right">₹{item.price}</div>
                  <div className="w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(billData.items.reduce((total, item) => total + (item.price * item.quantity), 0)).toFixed(2)}</span>
              </div>
              
              {gstData && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>CGST ({(gstData.taxRate/2).toFixed(1)}%):</span>
                    <span> ₹{(billData.items.reduce((total, item) => total + (item.price * item.quantity), 0)).toFixed(2)*(gstData.taxRate/2)/100} </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>SGST ({(gstData.taxRate/2).toFixed(1)}%):</span>
                    <span>₹{(billData.items.reduce((total, item) => total + (item.price * item.quantity), 0)).toFixed(2)*(gstData.taxRate/2)/100} </span>
                  </div>
                </>
              )}
              
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{billData.totalAmount}</span>
              </div>
              
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Payment Status:</span>
                <span>PAID ✓</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center text-sm text-gray-600 border-t print:border-t-2 print:border-dashed">
            <p className="mb-2">Thank you for dining with us!</p>
            <p>Visit us again soon 😊</p>
            {businessInfo?.website && (
              <p className="mt-2">Visit: {businessInfo.website}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-b-2 { border-bottom-width: 2px !important; }
          .print\\:border-dashed { border-style: dashed !important; }
          .print\\:border-t-2 { border-top-width: 2px !important; }
        }
      `}</style>
    </div>
  );
}

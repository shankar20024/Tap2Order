'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import thermalPrinter from '@/lib/thermalPrinter';
import toast from 'react-hot-toast';
import { FaPrint, FaArrowLeft, FaCog, FaEye } from 'react-icons/fa';

function BillPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printerAvailable, setPrinterAvailable] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [billNumber, setBillNumber] = useState(null);

  // Get bill data from URL params
  useEffect(() => {
    const tableNumber = searchParams.get('table');
    const orderIds = searchParams.get('orders')?.split(',') || [];
    const items = searchParams.get('items');
    const total = searchParams.get('total');
    const customerName = searchParams.get('customer') || 'Walk-in Customer';

    if (tableNumber && items && total) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(items));
        const itemsTotal = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        setBillData({
          tableNumber: parseInt(tableNumber),
          orderIds,
          items: parsedItems,
          total: parseFloat(total),
          itemsTotal: itemsTotal,
          customerName,
          timestamp: Date.now()
        });
      } catch (error) {
        toast.error('Invalid bill data');
        router.back();
      }
    } else {
      toast.error('Missing bill information');
      router.back();
    }
    setLoading(false);
  }, [searchParams, router]);

  // Check printer availability and fetch business info
  useEffect(() => {
    const checkPrinter = async () => {
      try {
        await thermalPrinter.connect();
        const printers = await thermalPrinter.getPrinters();
        setPrinterAvailable(printers.length > 0);
        
        // If printer is available, disable preview mode
        if (printers.length > 0) {
          setPreviewMode(false);
        }
      } catch (error) {
        setPrinterAvailable(false);
        setPreviewMode(true);
      }
    };

    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setBusinessInfo(data);
          
          // Format address properly
          let formattedAddress = '';
          if (typeof data.address === 'object') {
            const addressParts = [
              data.address.street,
              data.address.city,
              data.address.state,
              data.address.zipCode
            ].filter(part => part && part.trim());
            formattedAddress = addressParts.join(', ');
          } else {
            formattedAddress = data.address || '';
          }
          
          thermalPrinter.updateBusinessInfo({
            name: data.businessName || 'Tap2Order Restaurant',
            address: formattedAddress,
            phone: data.phone || '',
            email: data.email || '',
            gst: data.gstDetails?.gstNumber ? `GST: ${data.gstDetails.gstNumber}` : '',
            fssai: data.fssaiDetails?.fssaiNumber ? `FSSAI: ${data.fssaiDetails.fssaiNumber}` : ''
          });
        }
      } catch (error) {
        // Error fetching business info, continue with defaults
      }
    };

    if (session) {
      checkPrinter();
      fetchBusinessInfo();
    }
  }, [session]);

  // Calculate CGST and SGST based on user's GST rate
  const calculateTaxes = () => {
    if (!businessInfo?.gstDetails?.taxRate || !billData) {
      return { cgst: 0, sgst: 0, totalTax: 0 };
    }
    
    const gstRate = parseFloat(businessInfo.gstDetails.taxRate) / 100;
    const totalTax = billData.itemsTotal * gstRate;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    
    return { cgst, sgst, totalTax };
  };

  const taxes = calculateTaxes();
  const finalTotal = billData ? billData.itemsTotal + taxes.totalTax : 0;

  const handlePrint = async () => {
    if (!billData) return;

    setPrinting(true);
    try {
      if (printerAvailable && !previewMode) {
        // Direct thermal printing
        await thermalPrinter.printReceipt(billData);
        toast.success('Bill printed successfully!');
        router.back();
      } else {
        // Browser print fallback
        window.print();
      }
    } catch (error) {
      toast.error('Printing failed: ' + error.message);
    } finally {
      setPrinting(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill preview...</p>
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No bill data available</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Bill Preview</h1>
                <p className="text-sm text-gray-600">Table {billData.tableNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {printerAvailable && (
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    previewMode 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <FaEye className="inline mr-2" />
                  {previewMode ? 'Preview Mode' : 'Print Mode'}
                </button>
              )}
              
              <button
                onClick={handlePrint}
                disabled={printing}
                className={"bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"}
              >
                <FaPrint />
                <span>{printing ? 'Printing...' : printerAvailable && !previewMode ? 'Print Bill' : 'Print Preview'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview */}
      <div className="max-w-4xl mx-auto p-4 print:p-0">
        <div className="bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none">
          {/* Thermal Receipt Format */}
          <div className="thermal-receipt max-w-sm mx-auto bg-white p-6 print:p-4" style={{ fontFamily: 'monospace' }}>
            {/* Business Header */}
            <div className="text-center mb-3">
              <h2 className="text-base font-bold mb-1 leading-tight">
                {businessInfo?.businessName || 'Tap2Order Restaurant'}
              </h2>
              {businessInfo?.address && (
                <p className="text-xs text-gray-600 mb-1 leading-tight">
                  {typeof businessInfo.address === 'object' 
                    ? `${businessInfo.address.street || ''}, ${businessInfo.address.city || ''}, ${businessInfo.address.state || ''} ${businessInfo.address.zipCode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim()
                    : businessInfo.address
                  }
                </p>
              )}
              <div className="text-xs text-gray-600 space-y-0.5">
                {businessInfo?.phone && (
                  <div>Tel: {businessInfo.phone}</div>
                )}
                {businessInfo?.email && (
                  <div>{businessInfo.email}</div>
                )}
                <div className="flex justify-center space-x-3 mt-1">
                  {businessInfo?.gstDetails?.gstNumber && (
                    <span>GST: {businessInfo.gstDetails.gstNumber}</span>
                  )}
                  {businessInfo?.fssaiDetails?.fssaiNumber && (
                    <span>FSSAI: {businessInfo.fssaiDetails.fssaiNumber}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Customer Details */}
            <div className="mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span>Customer:</span>
                <span>{billData.customerName}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Date:</span>
                <span>{formatDate(billData.timestamp)}</span>
              </div>
              {billData.orderIds.length > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Bill No:</span>
                  <span>{billNumber || 1}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Items Header */}
            <div className="text-xs mb-2">
              <div className="flex justify-between font-bold">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Amount</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Items List */}
            <div className="text-xs mb-4">
              {billData.items.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="w-1/2 truncate">{item.name}</span>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/6 text-right">₹{item.price}</span>
                    <span className="w-1/6 text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                  {item.size && (
                    <div className="text-gray-500 ml-2">Size: {item.size}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Totals */}
            <div className="text-xs mb-4">
              <div className="flex justify-between mb-1">
                <span>Total Qty:</span>
                <span>{billData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Sub Total:</span>
                <span>₹{billData.itemsTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>CGST ({businessInfo?.gstDetails?.taxRate ? (parseFloat(businessInfo.gstDetails.taxRate) / 2).toFixed(1) : '0'}%):</span>
                <span>₹{taxes.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>SGST ({businessInfo?.gstDetails?.taxRate ? (parseFloat(businessInfo.gstDetails.taxRate) / 2).toFixed(1) : '0'}%):</span>
                <span>₹{taxes.sgst.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Grand Total */}
            <div className="text-sm font-bold mb-4">
              <div className="flex justify-between">
                <span>Grand Total:</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600">
              <p className="mb-1">Thank you for dining with us!</p>
              <p>Visit again soon!</p>
            </div>
          </div>
        </div>

        {/* Print Instructions */}
        {previewMode && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
            <div className="flex items-start space-x-3">
              <FaCog className="text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Print Instructions</h3>
                {printerAvailable ? (
                  <p className="text-sm text-blue-700">
                    Thermal printer detected! Switch to Print Mode to print directly to your thermal printer, 
                    or stay in Preview Mode to use browser printing.
                  </p>
                ) : (
                  <p className="text-sm text-blue-700">
                    No thermal printer detected. This preview will be printed using your browser's print function. 
                    For best results, install QZ Tray and connect a thermal printer.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .thermal-receipt {
            max-width: 80mm;
            margin: 0;
            padding: 10mm;
            font-size: 12px;
            line-height: 1.2;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading bill preview...</p>
      </div>
    </div>
  );
}

export default function BillPreview() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BillPreviewContent />
    </Suspense>
  );
}

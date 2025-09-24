import { toast } from "react-hot-toast";

const formatAddress = (address) => {
  if (!address) return '';
  return [
    address.street,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean).join(', ');
};

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const printBill = async (tableNumber, orders, session, printData) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!session?.user?.id) {
      toast.error("User not authenticated. Cannot print bill.");
      return;
    }

    const response = await fetch(`/api/business/info?userId=${session.user.id}`, { headers, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch business info: ${response.status} ${response.statusText}`);
    }
    const businessInfo = await response.json();

    const printWindow = window.open('', '_blank');
    
    // Use printData if available, otherwise calculate from orders (for backward compatibility)
    const isTakeaway = !!printData;
    const orderDetails = isTakeaway ? printData : (orders[0] || {});
    const items = isTakeaway ? printData.items : orders.flatMap(o => o.items || o.cart || []);
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const gstRate = parseFloat(businessInfo?.gstDetails?.taxRate) || 0;
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${tableNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold;
            width: 80mm; margin: 0; padding: 0 5mm; box-sizing: border-box;
            background: white; color: black; line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .border-t { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
          .font-bold { font-weight: bold; }
          .text-lg { font-size: 14px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mb-1 { margin-bottom: 2px; }
          .mt-2 { margin-top: 8px; }
          h1, p { margin: 0; }
        </style>
      </head>
      <body>
        <div>
          <!-- Header -->
          <div class="text-center border-b">
            <h1 class="text-lg font-bold mb-1">${businessInfo?.businessName || 'Restaurant'}</h1>
            ${businessInfo?.phone ? `<p class="mb-1">${businessInfo.phone}</p>` : ''}
            ${businessInfo?.address ? `<p class="mb-1">${formatAddress(businessInfo.address)}</p>` : ''}
            ${businessInfo?.gstDetails?.gstNumber ? `<p class="mb-1">GST: ${businessInfo.gstDetails.gstNumber}</p>` : ''}
            ${businessInfo?.fssaiDetails?.fssaiNumber ? `<p>FSSAI: ${businessInfo.fssaiDetails.fssaiNumber}</p>` : ''}
          </div>

          <!-- Bill Details -->
          <div class="border-b">
            <div class="flex justify-between"><p>Bill No:</p><p>#${orderDetails.orderNumber || (orderDetails._id ? orderDetails._id.slice(-6).toUpperCase() : 'N/A')}</p></div>
            <div class="flex justify-between"><p>Date:</p><p>${isTakeaway ? orderDetails.date : formatDate(orderDetails.createdAt)}</p></div>
            <div class="flex justify-between"><p>Table:</p><p>${tableNumber}</p></div>
            <div class="flex justify-between"><p>Customer:</p><p>${orderDetails.customerName || orderDetails.customerInfo?.name || 'Walk-in'}</p></div>
          </div>

          <!-- Items List -->
          <div class="border-b">
            <div class="flex justify-between font-bold">
              <p style="flex: 3;">Item</p>
              <p style="flex: 1; text-align: center;">Qty</p>
              <p style="flex: 1; text-align: right;">Amt</p>
            </div>
            ${items.map(item => `
              <div class="flex justify-between">
                <p style="flex: 3;">${item.name}${item.size ? ` (${item.size})` : ''}</p>
                <p style="flex: 1; text-align: center;">${item.quantity || 1}</p>
                <p style="flex: 1; text-align: right;">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div>
            <div class="flex justify-between"><p>Subtotal:</p><p>₹${subtotal.toFixed(2)}</p></div>
            ${gstRate > 0 ? `
              <div class="flex justify-between"><p>CGST (${(gstRate/2).toFixed(1)}%):</p><p>₹${(gstAmount/2).toFixed(2)}</p></div>
              <div class="flex justify-between"><p>SGST (${(gstRate/2).toFixed(1)}%):</p><p>₹${(gstAmount/2).toFixed(2)}</p></div>
            ` : ''}
            <div class="flex justify-between font-bold text-lg border-t">
              <p>Total:</p><p>₹${total.toFixed(2)}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center border-t mt-2">
            <p>Thank you for your visit!</p>
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); setTimeout(window.close, 100); }, 500); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error printing bill:', error);
    toast.error('Could not print bill. Check console for details.');
  }
};

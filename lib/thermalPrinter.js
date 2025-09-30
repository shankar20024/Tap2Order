class ThermalPrinterService {
  constructor() {
    this.qz = null;
    this.isConnected = false;
    this.settings = this.loadSettings();
  }

  // Load settings from localStorage
  loadSettings() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('thermalPrinterSettings');
      return saved ? JSON.parse(saved) : {
        printerName: '',
        template: 'standard',
        paperWidth: '80mm',
        fontSize: 'normal',
        printDensity: 'medium',
        cutPaper: true,
        openCashDrawer: false
      };
    }
    return {};
  }

  // Initialize QZ Tray connection
  async initialize() {
    try {
      if (typeof window === 'undefined') return false;

      // Load QZ Tray if not available
      if (!window.qz) {
        await this.loadQZTray();
      }

      this.qz = window.qz;
      await this.qz.websocket.connect();
      this.isConnected = true;
      return true;
    } catch (error) {
            this.isConnected = false;
      return false;
    }
  }

  // Load QZ Tray library
  loadQZTray() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Get available printers
  async getPrinters() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      return await this.qz.printers.find();
    } catch (error) {
            return [];
    }
  }

  // Generate receipt content based on template
  generateReceipt(orderData, businessInfo, template = null) {
    const selectedTemplate = template || this.settings.template || 'standard';
    const { paperWidth } = this.settings;
    const lineWidth = paperWidth === '58mm' ? 32 : 48;

    switch (selectedTemplate) {
      case 'detailed':
        return this.generateDetailedReceipt(orderData, businessInfo, lineWidth);
      case 'minimal':
        return this.generateMinimalReceipt(orderData, businessInfo, lineWidth);
      case 'branded':
        return this.generateBrandedReceipt(orderData, businessInfo, lineWidth);
      default:
        return this.generateStandardReceipt(orderData, businessInfo, lineWidth);
    }
  }

  // Standard receipt template
  generateStandardReceipt(orderData, businessInfo, lineWidth) {
    const lines = [];
    const separator = '-'.repeat(lineWidth);

    // Header - Business Name (centered)
    lines.push(this.centerText(businessInfo.businessName || 'RESTAURANT', lineWidth));
    
    // Address (centered)
    if (businessInfo.address) {
      const fullAddress = [
        businessInfo.address.street,
        businessInfo.address.city,
        businessInfo.address.state,
        businessInfo.address.zipCode
      ].filter(Boolean).join(', ');
      if (fullAddress) {
        lines.push(this.centerText(fullAddress, lineWidth));
      }
    }
    
    // Phone (centered)
    const phone = businessInfo.hotelPhone || businessInfo.phone;
    if (phone) {
      lines.push(this.centerText(`Tel: ${phone}`, lineWidth));
    }
    
    // Email (centered)
    if (businessInfo.email) {
      lines.push(this.centerText(businessInfo.email, lineWidth));
    }
    
    // GST and FSSAI (centered)
    const gstFssai = [];
    if (businessInfo.gstDetails?.gstNumber) {
      gstFssai.push(`GST: ${businessInfo.gstDetails.gstNumber}`);
    }
    if (businessInfo.fssaiDetails?.fssaiNumber) {
      gstFssai.push(`FSSAI: ${businessInfo.fssaiDetails.fssaiNumber}`);
    }
    if (gstFssai.length > 0) {
      lines.push(this.centerText(gstFssai.join('  '), lineWidth));
    }
    
    lines.push(separator);

    // Customer and Order details
    const leftColumn = [];
    const rightColumn = [];
    
    if (orderData.customerName && orderData.customerName !== 'Walk-in Customer') {
      leftColumn.push(`Customer: ${orderData.customerName}`);
    }
    if (orderData.billNumber) {
      rightColumn.push(orderData.billNumber.toString());
    }
    
    leftColumn.push(`Date: ${new Date().toLocaleDateString()}`);
    rightColumn.push(`${new Date().toLocaleTimeString()}`);
    
    if (orderData.billNumber) {
      leftColumn.push(`Bill No: ${orderData.billNumber}`);
    }

    // Print customer and date info
    for (let i = 0; i < Math.max(leftColumn.length, rightColumn.length); i++) {
      const left = leftColumn[i] || '';
      const right = rightColumn[i] || '';
      if (left && right) {
        const padding = lineWidth - left.length - right.length;
        lines.push(left + ' '.repeat(Math.max(1, padding)) + right);
      } else if (left) {
        lines.push(left);
      } else if (right) {
        lines.push(right.padStart(lineWidth));
      }
    }
    
    lines.push(separator);

    // Items header
    lines.push('Item'.padEnd(Math.floor(lineWidth * 0.4)) + 
              'Qty'.padEnd(8) + 
              'Price'.padEnd(10) + 
              'Amount'.padStart(Math.floor(lineWidth * 0.2)));
    lines.push(separator);

    // Items
    orderData.items.forEach(item => {
      const itemName = item.name.length > Math.floor(lineWidth * 0.4) - 2 
        ? item.name.substring(0, Math.floor(lineWidth * 0.4) - 2) 
        : item.name;
      
      lines.push(itemName.padEnd(Math.floor(lineWidth * 0.4)) + 
                 item.quantity.toString().padEnd(8) + 
                 `₹${item.price}`.padEnd(10) + 
                 `₹${(item.quantity * item.price)}`.padStart(Math.floor(lineWidth * 0.2)));
      
      // Add size if available
      if (item.size && item.size !== 'regular') {
        lines.push(`  Size: ${item.size}`);
      }
    });

    lines.push(separator);

    // Totals section
    const totalQty = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    lines.push(`Total Qty: ${totalQty}`.padEnd(Math.floor(lineWidth/2)) + 
               `Sub Total: ₹${orderData.gstDetails?.subtotal || orderData.totalAmount}`.padStart(Math.floor(lineWidth/2)));

    // GST breakdown if applicable
    if (orderData.gstDetails && orderData.gstDetails.isGstApplicable) {
      const cgstRate = orderData.gstDetails.taxRate / 2;
      const sgstRate = orderData.gstDetails.taxRate / 2;
      lines.push(`CGST (${cgstRate}%): ₹${orderData.gstDetails.cgstAmount}`.padStart(lineWidth));
      lines.push(`SGST (${sgstRate}%): ₹${orderData.gstDetails.sgstAmount}`.padStart(lineWidth));
    }

    lines.push(separator);
    
    // Grand Total
    const grandTotal = orderData.gstDetails?.grandTotal || orderData.totalAmount;
    lines.push(`Grand Total: ₹${grandTotal}`.padStart(lineWidth));
    
    lines.push(separator);
    lines.push(this.centerText('Thank you for dining with us!', lineWidth));
    lines.push(this.centerText('Visit again soon!', lineWidth));
    lines.push('');

    return lines.join('\n');
  }

  // Detailed receipt template
  generateDetailedReceipt(orderData, businessInfo, lineWidth) {
    const lines = [];
    const separator = '='.repeat(lineWidth);

    // Header with GST info
    lines.push(this.centerText(businessInfo.businessName || 'RESTAURANT', lineWidth));
    if (businessInfo.address) {
      lines.push(this.centerText(businessInfo.address, lineWidth));
    }
    if (businessInfo.gstDetails?.gstNumber) {
      lines.push(this.centerText(`GST: ${businessInfo.gstDetails.gstNumber}`, lineWidth));
    }
    if (businessInfo.phone) {
      lines.push(this.centerText(`Phone: ${businessInfo.phone}`, lineWidth));
    }
    lines.push(separator);

    // Detailed order info
    if (orderData.billNumber) {
      lines.push(`Bill No: ${orderData.billNumber}`);
    }
    if (orderData.tableNumber) {
      lines.push(`Table: ${orderData.tableNumber}`);
    }
    if (orderData.customerName && orderData.customerName !== 'Walk-in Customer') {
      lines.push(`Customer: ${orderData.customerName}`);
    }
    if (orderData.customerPhone) {
      lines.push(`Phone: ${orderData.customerPhone}`);
    }
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Time: ${new Date().toLocaleTimeString()}`);
    lines.push('');

    // Items with detailed breakdown
    orderData.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.name}`);
      if (item.size && item.size !== 'regular') {
        lines.push(`   Size: ${item.size}`);
      }
      if (item.specialInstructions) {
        lines.push(`   Note: ${item.specialInstructions}`);
      }
      lines.push(`   ₹${item.price.toFixed(2)} x ${item.quantity} = ₹${(item.quantity * item.price).toFixed(2)}`);
      lines.push('');
    });

    lines.push(separator);

    // GST breakdown
    if (orderData.gstDetails && orderData.gstDetails.isGstApplicable) {
      lines.push(`Subtotal: ₹${orderData.gstDetails.subtotal.toFixed(2)}`.padStart(lineWidth));
      lines.push(`CGST (${orderData.gstDetails.taxRate/2}%): ₹${orderData.gstDetails.cgstAmount.toFixed(2)}`.padStart(lineWidth));
      lines.push(`SGST (${orderData.gstDetails.taxRate/2}%): ₹${orderData.gstDetails.sgstAmount.toFixed(2)}`.padStart(lineWidth));
      lines.push(separator);
      lines.push(`TOTAL: ₹${orderData.gstDetails.grandTotal.toFixed(2)}`.padStart(lineWidth));
    } else {
      lines.push(`TOTAL: ₹${orderData.totalAmount.toFixed(2)}`.padStart(lineWidth));
    }

    lines.push(separator);
    lines.push(this.centerText('Thank you for visiting!', lineWidth));
    lines.push(this.centerText('Visit us again soon!', lineWidth));
    lines.push('');

    return lines.join('\n');
  }

  // Minimal receipt template
  generateMinimalReceipt(orderData, businessInfo, lineWidth) {
    const lines = [];
    const separator = '-'.repeat(Math.min(lineWidth, 20));

    // Minimal header
    lines.push(this.centerText(businessInfo.businessName || 'RESTAURANT', lineWidth));
    lines.push(separator);

    // Basic info
    if (orderData.tableNumber) {
      lines.push(`Table ${orderData.tableNumber}`);
    }

    // Items
    orderData.items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const total = `₹${(item.quantity * item.price).toFixed(2)}`;
      lines.push(`${itemLine.substring(0, lineWidth - 8)} ${total}`.padEnd(lineWidth));
    });

    lines.push(separator);
    
    // Total
    const finalTotal = orderData.gstDetails?.grandTotal || orderData.totalAmount;
    lines.push(`Total: ₹${finalTotal.toFixed(2)}`.padStart(lineWidth));
    lines.push('');

    return lines.join('\n');
  }

  // Branded receipt template
  generateBrandedReceipt(orderData, businessInfo, lineWidth) {
    const lines = [];
    const doubleSeparator = '═'.repeat(lineWidth);
    const singleSeparator = '─'.repeat(lineWidth);

    // Branded header
    lines.push(doubleSeparator);
    lines.push(this.centerText(`${businessInfo.businessName || 'RESTAURANT'}`, lineWidth));
    if (businessInfo.tagline) {
      lines.push(this.centerText(businessInfo.tagline, lineWidth));
    } else {
      lines.push(this.centerText('Premium Dining Experience', lineWidth));
    }
    if (businessInfo.address) {
      lines.push(this.centerText(businessInfo.address, lineWidth));
    }
    if (businessInfo.phone) {
      lines.push(this.centerText(`Phone: ${businessInfo.phone}`, lineWidth));
    }
    if (businessInfo.email) {
      lines.push(this.centerText(`Email: ${businessInfo.email}`, lineWidth));
    }
    lines.push(doubleSeparator);

    // Order details
    const billInfo = `Bill #${orderData.billNumber || '001'}`.padEnd(Math.floor(lineWidth/2)) + 
                    `Table: ${orderData.tableNumber || 'N/A'}`.padStart(Math.floor(lineWidth/2));
    lines.push(billInfo);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push('');

    // Items
    orderData.items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const price = `₹${item.price.toFixed(2)}`;
      const total = `₹${(item.quantity * item.price).toFixed(2)}`;
      
      lines.push(itemLine);
      lines.push(`${price} x ${item.quantity} = ${total}`.padStart(lineWidth));
    });

    lines.push(singleSeparator);

    // Totals with GST
    if (orderData.gstDetails && orderData.gstDetails.isGstApplicable) {
      lines.push(`Subtotal: ₹${orderData.gstDetails.subtotal.toFixed(2)}`.padStart(lineWidth));
      lines.push(`Tax: ₹${orderData.gstDetails.totalGst.toFixed(2)}`.padStart(lineWidth));
      lines.push(`Total: ₹${orderData.gstDetails.grandTotal.toFixed(2)}`.padStart(lineWidth));
    } else {
      lines.push(`Total: ₹${orderData.totalAmount.toFixed(2)}`.padStart(lineWidth));
    }

    lines.push(doubleSeparator);
    lines.push(this.centerText('Thank you for dining with us!', lineWidth));
    lines.push(this.centerText('Visit us again soon!', lineWidth));
    lines.push('');

    return lines.join('\n');
  }

  // Center text helper
  centerText(text, width) {
    if (text.length >= width) return text.substring(0, width);
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
  }

  // Print receipt
  async printReceipt(orderData, businessInfo, template = null) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      if (!this.settings.printerName) {
        throw new Error('No printer selected. Please configure printer settings.');
      }

      const receiptContent = this.generateReceipt(orderData, businessInfo, template);
      
      // Create print configuration
      const config = this.qz.configs.create(this.settings.printerName);
      
      // Prepare print data
      const printData = [{
        type: 'raw',
        format: 'plain',
        data: receiptContent
      }];

      // Add paper cut command if enabled
      if (this.settings.cutPaper) {
        printData.push({
          type: 'raw',
          format: 'plain',
          data: '\x1D\x56\x00' // ESC/POS cut command
        });
      }

      // Add cash drawer command if enabled
      if (this.settings.openCashDrawer) {
        printData.push({
          type: 'raw',
          format: 'plain',
          data: '\x1B\x70\x00\x19\xFA' // ESC/POS cash drawer command
        });
      }

      await this.qz.print(config, printData);
      return { success: true, message: 'Receipt printed successfully!' };
    } catch (error) {
            return { success: false, message: error.message || 'Failed to print receipt' };
    }
  }

  // Test print functionality
  async testPrint() {
    const testOrder = {
      billNumber: '001',
      tableNumber: '5',
      customerName: 'Test Customer',
      items: [
        { name: 'Test Item 1', quantity: 1, price: 100 },
        { name: 'Test Item 2', quantity: 2, price: 150 }
      ],
      totalAmount: 400,
      gstDetails: {
        isGstApplicable: true,
        subtotal: 400,
        cgstAmount: 36,
        sgstAmount: 36,
        totalGst: 72,
        grandTotal: 472,
        taxRate: 18
      }
    };

    const testBusiness = {
      businessName: 'TEST RESTAURANT',
      address: {
        street: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456'
      },
      phone: '+91-9876543210',
      hotelPhone: '+91-9876543210',
      email: 'test@restaurant.com',
      gstDetails: { 
        gstNumber: 'TEST123456789',
        taxRate: 18
      },
      fssaiDetails: {
        fssaiNumber: '12345678901234'
      }
    };

    return await this.printReceipt(testOrder, testBusiness);
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem('thermalPrinterSettings', JSON.stringify(this.settings));
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Check connection status
  async checkConnection() {
    try {
      if (!this.qz) return false;
      return await this.qz.websocket.isActive();
    } catch (error) {
      return false;
    }
  }

  // Disconnect
  async disconnect() {
    try {
      if (this.qz && this.isConnected) {
        await this.qz.websocket.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
          }
  }
}

// Create and export singleton instance
const thermalPrinter = new ThermalPrinterService();
export default thermalPrinter;

// Conditional QZ Tray import for browser environment only
let qz = null;

// Dynamic import function for QZ Tray
const loadQZ = async () => {
  if (typeof window !== 'undefined' && !qz) {
    try {
      // Use dynamic import instead of require
      const qzModule = await import('qz-tray');
      qz = qzModule.default || qzModule;
      return qz;
    } catch (error) {
      return null;
    }
  }
  return qz;
};

class ThermalPrinterService {
  constructor() {
    this.isConnected = false;
    this.defaultPrinter = null;
    this.permissionGranted = false; // Cache permission status
    this.connectionAttempted = false; // Track if connection was attempted
    this.printerSettings = {
      name: '',
      paperWidth: 80, // 58mm or 80mm
      characterSet: 'UTF-8',
      density: 'medium',
      copies: 1
    };
    this.businessInfo = {
      name: 'Tap2Order Restaurant',
      address: 'Your Restaurant Address',
      phone: '+91 XXXXX XXXXX',
      email: 'info@tap2order.com',
      gst: 'GST No: XXXXXXXXX'
    };
  }

  // Check if QZ Tray is available
  async isQZAvailable() {
    try {
      if (typeof window === 'undefined') return false;
      
      const qzInstance = await loadQZ();
      return qzInstance && qzInstance.websocket;
    } catch (error) {
      return false;
    }
  }

  // Initialize QZ Tray connection
  async connect() {
    try {
      // Load QZ Tray dynamically
      const qzInstance = await loadQZ();
      if (!qzInstance || !qzInstance.websocket) {
        throw new Error('QZ_NOT_INSTALLED');
      }

      qz = qzInstance;

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      
      // Provide user-friendly error messages
      if (error.message === 'QZ_NOT_INSTALLED') {
        throw new Error('QZ Tray is not installed. Please download from https://qz.io/download/');
      } else if (error.message.includes('WebSocket connection')) {
        throw new Error('QZ Tray is not running. Please start QZ Tray application.');
      } else {
        throw new Error('Cannot connect to thermal printer service.');
      }
    }
  }

  // Disconnect from QZ Tray
  async disconnect() {
    try {
      if (qz && qz.websocket && qz.websocket.isActive()) {
        await qz.websocket.disconnect();
      }
      this.isConnected = false;
    } catch (error) {
      // Disconnect failed, continue
    }
  }

  // Get available printers with better error handling
  async getPrinters() {
    try {
      const isAvailable = await this.isQZAvailable();
      if (!isAvailable) {
        return [];
      }
      
      if (!this.isConnected) {
        await this.connect();
      }
      
      const printers = await qz.printers.find();
      return printers || [];
    } catch (error) {
      return [];
    }
  }

  // Alias for getPrinters for backward compatibility
  async getAvailablePrinters() {
    return await this.getPrinters();
  }

  // Set default printer
  setPrinter(printerName) {
    this.defaultPrinter = printerName;
    this.printerSettings.name = printerName;
  }

  // Update business information
  updateBusinessInfo(info) {
    this.businessInfo = { ...this.businessInfo, ...info };
  }

  // Fetch user business info from API
  async fetchUserBusinessInfo() {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.businessInfo) {
          this.updateBusinessInfo(data.businessInfo);
          return data.businessInfo;
        }
      }
    } catch (error) {
      // Error fetching business info, continue with defaults
    }
    return null;
  }

  // Update printer settings
  updatePrinterSettings(settings) {
    this.printerSettings = { ...this.printerSettings, ...settings };
  }

  // Generate ESC/POS commands for receipt
  generateReceiptCommands(receiptData) {
    const { tableNumber, items, customerName, billNumber, businessInfo, itemsTotal, timestamp } = receiptData;
    const width = this.printerSettings.paperWidth === 58 ? 32 : 48;
    
    let commands = [];
    
    // Initialize printer
    commands.push('\x1B\x40'); // ESC @ - Initialize printer
    commands.push('\x1B\x61\x01'); // ESC a 1 - Center alignment
    
    // Business header - match preview format
    commands.push('\x1B\x21\x10'); // ESC ! 16 - Double width
    commands.push((businessInfo?.businessName || 'Tap2Order Restaurant') + '\n');
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    
    // Address
    if (businessInfo?.address) {
      const address = typeof businessInfo.address === 'object' 
        ? `${businessInfo.address.street || ''}, ${businessInfo.address.city || ''}, ${businessInfo.address.state || ''} ${businessInfo.address.zipCode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim()
        : businessInfo.address;
      commands.push(address + '\n');
    }
    
    // Contact info
    if (businessInfo?.phone) {
      commands.push('Tel: ' + businessInfo.phone + '\n');
    }
    if (businessInfo?.email) {
      commands.push(businessInfo.email + '\n');
    }
    
    // GST and FSSAI on same line
    let gstFssaiLine = '';
    if (businessInfo?.gstDetails?.gstNumber) {
      gstFssaiLine += 'GST: ' + businessInfo.gstDetails.gstNumber;
    }
    if (businessInfo?.fssaiDetails?.fssaiNumber) {
      if (gstFssaiLine) gstFssaiLine += '   ';
      gstFssaiLine += 'FSSAI: ' + businessInfo.fssaiDetails.fssaiNumber;
    }
    if (gstFssaiLine) {
      commands.push(gstFssaiLine + '\n');
    }
    
    // Separator line
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Customer details - match preview format
    commands.push('\x1B\x61\x00'); // ESC a 0 - Left alignment
    commands.push(`Customer: ${customerName || 'Walk-in Customer'}\n`);
    commands.push(`Date: ${new Date(timestamp || Date.now()).toLocaleDateString('en-IN')} ${new Date(timestamp || Date.now()).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}\n`);
    commands.push(`Bill No: ${billNumber || 1}\n`);
    
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Items header
    commands.push(this.formatLine('Item', 'Qty', 'Price', 'Amount', width));
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Items list
    items.forEach(item => {
      const itemName = this.truncateText(item.name, width - 20);
      const qty = item.quantity.toString();
      const rate = `₹${item.price}`;
      const amount = `₹${(item.price * item.quantity).toLocaleString('en-IN')}`;
      
      commands.push(this.formatLine(itemName, qty, rate, amount, width));
      
      // Add size info if available
      if (item.size) {
        commands.push(`  Size: ${item.size}\n`);
      }
    });
    
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Totals - match preview format
    commands.push(this.formatTotalLine('Total Qty:', items.reduce((sum, item) => sum + item.quantity, 0).toString(), width));
    commands.push(this.formatTotalLine('Sub Total:', `₹${itemsTotal.toLocaleString('en-IN')}`, width));
    
    // Calculate GST like in preview
    if (businessInfo?.gstDetails?.taxRate) {
      const gstRate = parseFloat(businessInfo.gstDetails.taxRate) / 100;
      const totalTax = itemsTotal * gstRate;
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      const halfRate = (parseFloat(businessInfo.gstDetails.taxRate) / 2).toFixed(1);
      
      commands.push(this.formatTotalLine(`CGST (${halfRate}%):`, `₹${cgst.toLocaleString('en-IN')}`, width));
      commands.push(this.formatTotalLine(`SGST (${halfRate}%):`, `₹${sgst.toLocaleString('en-IN')}`, width));
    }
    
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Grand total
    const finalTotal = itemsTotal + (businessInfo?.gstDetails?.taxRate ? (itemsTotal * parseFloat(businessInfo.gstDetails.taxRate) / 100) : 0);
    commands.push('\x1B\x21\x10'); // ESC ! 16 - Double width
    commands.push(this.formatTotalLine('Grand Total:', `₹${finalTotal.toLocaleString('en-IN')}`, width));
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Footer
    commands.push('\x1B\x61\x01'); // ESC a 1 - Center alignment
    commands.push('\nThank you for dining with us!\n');
    commands.push('Visit again soon!\n\n');
    
    // Cut paper
    commands.push('\x1D\x56\x41\x10'); // GS V A 16 - Partial cut
    
    return commands.join('');
  }

  // Helper function to repeat characters
  repeatChar(char, count) {
    return char.repeat(count);
  }

  // Helper function to truncate text
  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  // Helper function to format item lines
  formatLine(item, qty, rate, amount, width) {
    const qtyWidth = 4;
    const rateWidth = 8;
    const amountWidth = 10;
    const itemWidth = width - qtyWidth - rateWidth - amountWidth - 3;
    
    const formattedItem = this.truncateText(item, itemWidth).padEnd(itemWidth);
    const formattedQty = qty.padStart(qtyWidth);
    const formattedRate = rate.padStart(rateWidth);
    const formattedAmount = amount.padStart(amountWidth);
    
    return `${formattedItem} ${formattedQty} ${formattedRate} ${formattedAmount}\n`;
  }

  // Helper function to format total lines
  formatTotalLine(label, amount, width) {
    const padding = width - label.length - amount.length;
    return label + ' '.repeat(Math.max(1, padding)) + amount + '\n';
  }

  // Print receipt with enhanced error handling
  async printReceipt(receiptData) {
    try {
      if (!await this.isQZAvailable()) {
        return false;
      }
      
      if (!this.isConnected) {
        await this.connect();
      }

      // Use explicitly passed printer or fallback to default
      const printerName = receiptData.printer || this.defaultPrinter;
      
      if (!printerName) {
        // Auto-select first available printer if none is set
        const availablePrinters = await this.getPrinters();
        if (availablePrinters.length === 0) {
          throw new Error('No thermal printers found. Please connect a thermal printer.');
        }
        this.defaultPrinter = availablePrinters[0];
      }

      // Get the final printer name
      const finalPrinterName = receiptData.printer || this.defaultPrinter;

      // Verify printer is available
      const availablePrinters = await this.getPrinters();
      if (!availablePrinters.includes(finalPrinterName)) {
        throw new Error(`Printer "${finalPrinterName}" is not available. Please check printer connection.`);
      }

      const commands = this.generateReceiptCommands(receiptData);
      
      const config = qz.configs.create(finalPrinterName, {
        copies: this.printerSettings.copies,
        jobName: `Table ${receiptData.tableNumber} Receipt`
      });

      const data = [{
        type: 'raw',
        format: 'command',
        data: commands
      }];

      await qz.print(config, data);
      return true;
    } catch (error) {
      throw new Error(`Printing failed: ${error.message}`);
    }
  }

  // Test print function
  async testPrint() {
    const testData = {
      tableNumber: 'TEST',
      items: [
        { name: 'Test Item 1', quantity: 2, price: 150 },
        { name: 'Test Item 2', quantity: 1, price: 200 }
      ],
      total: 500,
      subtotal: 450,
      tax: 50,
      timestamp: Date.now()
    };

    return await this.printReceipt(testData);
  }

  // Check if thermal printing is available
  async isAvailable() {
    try {
      if (!await this.isQZAvailable()) {
        return false;
      }
      await this.connect();
      const printers = await this.getPrinters();
      return printers.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const thermalPrinter = new ThermalPrinterService();

export default thermalPrinter;

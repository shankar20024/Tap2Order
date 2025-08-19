import qz from 'qz-tray';

class ThermalPrinterService {
  constructor() {
    this.isConnected = false;
    this.defaultPrinter = null;
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

  // Initialize QZ Tray connection
  async connect() {
    try {
      // Check if QZ Tray is available
      if (typeof qz === 'undefined') {
        throw new Error('QZ Tray library not loaded. Please install QZ Tray from https://qz.io/download/');
      }

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to QZ Tray:', error);
      this.isConnected = false;
      
      // Provide user-friendly error messages
      if (error.message.includes('WebSocket connection')) {
        throw new Error('QZ Tray is not running. Please download and start QZ Tray from https://qz.io/download/');
      } else if (error.message.includes('library not loaded')) {
        throw new Error('QZ Tray not installed. Please download from https://qz.io/download/');
      } else {
        throw new Error('Cannot connect to thermal printer. Please ensure QZ Tray is installed and running.');
      }
    }
  }

  // Disconnect from QZ Tray
  async disconnect() {
    try {
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
      }
      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from QZ Tray:', error);
    }
  }

  // Get available printers
  async getPrinters() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await qz.printers.find();
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
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
      const response = await fetch('/api/user-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.businessInfo) {
          this.updateBusinessInfo(data.businessInfo);
          return data.businessInfo;
        }
      }
    } catch (error) {
      console.error('Error fetching user business info:', error);
    }
    return null;
  }

  // Update printer settings
  updatePrinterSettings(settings) {
    this.printerSettings = { ...this.printerSettings, ...settings };
  }

  // Generate ESC/POS commands for receipt
  generateReceiptCommands(receiptData) {
    const { tableNumber, items, total, subtotal, tax, orderIds, timestamp } = receiptData;
    const width = this.printerSettings.paperWidth === 58 ? 32 : 48;
    
    let commands = [];
    
    // Initialize printer
    commands.push('\x1B\x40'); // ESC @ - Initialize printer
    commands.push('\x1B\x61\x01'); // ESC a 1 - Center alignment
    
    // Business header
    commands.push('\x1B\x21\x30'); // ESC ! 48 - Double height and width
    commands.push(this.businessInfo.name + '\n');
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    
    if (this.businessInfo.address) {
      commands.push(this.businessInfo.address + '\n');
    }
    if (this.businessInfo.phone) {
      commands.push('Tel: ' + this.businessInfo.phone + '\n');
    }
    if (this.businessInfo.email) {
      commands.push(this.businessInfo.email + '\n');
    }
    if (this.businessInfo.gst) {
      commands.push(this.businessInfo.gst + '\n');
    }
    
    // Separator line
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Order details
    commands.push('\x1B\x61\x00'); // ESC a 0 - Left alignment
    commands.push(`Table: ${tableNumber}\n`);
    commands.push(`Date: ${new Date(timestamp || Date.now()).toLocaleString('en-IN')}\n`);
    if (orderIds && orderIds.length > 0) {
      commands.push(`Order IDs: ${orderIds.join(', ')}\n`);
    }
    commands.push(this.repeatChar('-', width) + '\n');
    
    // Items header
    commands.push(this.formatLine('Item', 'Qty', 'Rate', 'Amount', width));
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
    
    // Totals
    if (subtotal && subtotal !== total) {
      commands.push(this.formatTotalLine('Subtotal:', `₹${subtotal.toLocaleString('en-IN')}`, width));
    }
    if (tax && tax > 0) {
      commands.push(this.formatTotalLine('Tax:', `₹${tax.toLocaleString('en-IN')}`, width));
    }
    
    commands.push('\x1B\x21\x10'); // ESC ! 16 - Double width
    commands.push(this.formatTotalLine('TOTAL:', `₹${total.toLocaleString('en-IN')}`, width));
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    
    commands.push(this.repeatChar('=', width) + '\n');
    
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

  // Print receipt
  async printReceipt(receiptData) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Use explicitly passed printer or fallback to default
      const printerName = receiptData.printer || this.defaultPrinter;
      
      if (!printerName) {
        throw new Error('No printer selected. Please select a printer first.');
      }

      const commands = this.generateReceiptCommands(receiptData);
      
      const config = qz.configs.create(printerName, {
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
      console.error('Printing error:', error);
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
}

// Create singleton instance
const thermalPrinter = new ThermalPrinterService();

export default thermalPrinter;

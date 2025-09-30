'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPrint, 
  FaCog, 
  FaCheck, 
  FaTimes, 
  FaWifi, 
  FaExclamationTriangle,
  FaEye,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import thermalPrinter from '@/lib/thermalPrinter';

const RECEIPT_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Receipt',
    description: 'Classic thermal receipt format with business header and itemized list'
  },
  {
    id: 'detailed',
    name: 'Detailed Receipt',
    description: 'Comprehensive receipt with GST breakdown and customer details'
  },
  {
    id: 'minimal',
    name: 'Minimal Receipt',
    description: 'Clean and simple receipt format with essential information only'
  },
  {
    id: 'branded',
    name: 'Branded Receipt',
    description: 'Professional receipt with enhanced branding and contact details'
  }
];

export default function PrinterSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [isLoading, setIsLoading] = useState(false);
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [settings, setSettings] = useState({
    printerName: '',
    template: 'standard',
    paperWidth: '80mm',
    fontSize: 'normal',
    printDensity: 'medium',
    cutPaper: true,
    openCashDrawer: false
  });

  useEffect(() => {
    loadSettings();
    checkPrinterConnection();
    generateTemplatePreviews();
  }, []);

  useEffect(() => {
    generateTemplatePreviews();
  }, [paperWidth, selectedTemplate]);

  const generateTemplatePreviews = () => {
    // Sample business info
    const sampleBusinessInfo = {
      businessName: 'Anjali Caterers',
      address: {
        street: 'Jay Daman dev Nagar',
        city: 'Thane',
        state: 'Maharashtra',
        zipCode: '401101'
      },
      phone: '07558776795',
      hotelPhone: '07558776795',
      email: 'test@tap2order.com',
      gstDetails: {
        gstNumber: '22AAAAA0000A1Z5',
        taxRate: 5
      },
      fssaiDetails: {
        fssaiNumber: '10017011000457'
      }
    };

    // Sample order data
    const sampleOrderData = {
      billNumber: '1',
      tableNumber: '5',
      customerName: 'Shankar',
      customerPhone: '+91-9876543210',
      items: [
        { name: 'Rajma Chawal', quantity: 2, price: 180, size: 'regular' },
        { name: 'Paneer Butter Masala', quantity: 1, price: 120, size: 'half' },
        { name: 'Palak Paneer', quantity: 1, price: 200, size: 'full' },
        { name: 'Cold-drinks', quantity: 2, price: 80 }
      ],
      totalAmount: 840,
      gstDetails: {
        isGstApplicable: true,
        subtotal: 840,
        cgstAmount: 21,
        sgstAmount: 21,
        totalGst: 42,
        grandTotal: 882,
        taxRate: 5
      }
    };

    const previews = {};
    
    RECEIPT_TEMPLATES.forEach(template => {
      try {
        const receiptContent = thermalPrinter.generateReceipt(
          sampleOrderData, 
          sampleBusinessInfo, 
          template.id
        );
        previews[template.id] = receiptContent;
      } catch (error) {
                previews[template.id] = `Error generating preview for ${template.name}`;
      }
    });

    setTemplatePreviews(previews);
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('thermalPrinterSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setSelectedPrinter(parsed.printerName || '');
      setSelectedTemplate(parsed.template || 'standard');
      setPaperWidth(parsed.paperWidth || '80mm');
    }
  };

  const saveSettings = () => {
    const newSettings = {
      ...settings,
      printerName: selectedPrinter,
      template: selectedTemplate,
      paperWidth: paperWidth
    };
    
    localStorage.setItem('thermalPrinterSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    toast.success('Settings saved successfully!');
  };

  const checkPrinterConnection = async () => {
    setIsLoading(true);
    try {
      // Check if QZ Tray is available
      if (typeof window !== 'undefined' && window.qz) {
        await window.qz.websocket.connect();
        const printers = await window.qz.printers.find();
        setAvailablePrinters(printers);
        setIsConnected(true);
        toast.success('Connected to QZ Tray');
      } else {
        // Load QZ Tray if not available
        await loadQZTray();
      }
    } catch (error) {
            setIsConnected(false);
      toast.error('Failed to connect to printer service');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQZTray = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && !window.qz) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';
        script.onload = async () => {
          try {
            await window.qz.websocket.connect();
            const printers = await window.qz.printers.find();
            setAvailablePrinters(printers);
            setIsConnected(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  };

  const testPrint = async () => {
    if (!selectedPrinter) {
      toast.error('Please select a printer first');
      return;
    }

    setIsLoading(true);
    try {
      // Update thermal printer settings before test print
      thermalPrinter.updateSettings({
        printerName: selectedPrinter,
        template: selectedTemplate,
        paperWidth: paperWidth,
        fontSize: settings.fontSize,
        printDensity: settings.printDensity,
        cutPaper: settings.cutPaper,
        openCashDrawer: settings.openCashDrawer
      });

      const result = await thermalPrinter.testPrint();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
            toast.error('Failed to send test print');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      printerName: '',
      template: 'standard',
      paperWidth: '80mm',
      fontSize: 'normal',
      printDensity: 'medium',
      cutPaper: true,
      openCashDrawer: false
    });
    setSelectedPrinter('');
    setSelectedTemplate('standard');
    setPaperWidth('80mm');
    localStorage.removeItem('thermalPrinterSettings');
    toast.success('Settings reset to default');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                <FaPrint className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Thermal Printer Settings</h1>
                <p className="text-gray-600">Configure your thermal printer and receipt templates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <FaWifi />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <FaExclamationTriangle />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Printer Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCog className="text-blue-500" />
              Printer Configuration
            </h2>

            <div className="space-y-4">
              {/* Printer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Printer
                </label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a printer...</option>
                  {availablePrinters.map((printer, index) => (
                    <option key={index} value={printer}>
                      {printer}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Width
                </label>
                <select
                  value={paperWidth}
                  onChange={(e) => setPaperWidth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Print Density */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Print Density
                </label>
                <select
                  value={settings.printDensity}
                  onChange={(e) => setSettings({...settings, printDensity: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.cutPaper}
                    onChange={(e) => setSettings({...settings, cutPaper: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto cut paper after printing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.openCashDrawer}
                    onChange={(e) => setSettings({...settings, openCashDrawer: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Open cash drawer after printing</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={checkPrinterConnection}
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Refresh Printers'}
                </button>
                <button
                  onClick={testPrint}
                  disabled={!selectedPrinter || isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Test Print
                </button>
              </div>
            </div>
          </motion.div>

          {/* Template Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaEye className="text-green-500" />
              Receipt Templates
            </h2>

            <div className="space-y-4">
              {RECEIPT_TEMPLATES.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <FaCheck className="text-blue-500 mt-1" />
                    )}
                  </div>
                  
                  {/* Template Preview */}
                  <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                    <div className="whitespace-pre-line">
                      {templatePreviews[template.id]}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save/Reset Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Save Configuration</h3>
              <p className="text-sm text-gray-600">Save your printer settings and template preferences</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaUndo />
                Reset
              </button>
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <FaSave />
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

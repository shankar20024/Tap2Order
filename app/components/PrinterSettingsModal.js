"use client";
import { useState, useEffect } from 'react';
import { FaPrint, FaTimes, FaCog, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import thermalPrinter from '@/lib/thermalPrinter';
import toast from 'react-hot-toast';

const PrinterSettingsModal = ({ isOpen, onClose, onSave }) => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [paperWidth, setPaperWidth] = useState(80);
  const [copies, setCopies] = useState(1);
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Tap2Order Restaurant',
    address: 'Your Restaurant Address',
    phone: '+91 XXXXX XXXXX',
    email: 'info@tap2order.com',
    gst: 'GST No: XXXXXXXXX'
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
      loadSettings();
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    try {
      setIsConnecting(true);
      await thermalPrinter.connect();
      setIsConnected(true);
      const availablePrinters = await thermalPrinter.getPrinters();
      setPrinters(availablePrinters);
      
      // Auto-select first thermal printer if available
      const thermalPrinterNames = availablePrinters.filter(name => 
        name.toLowerCase().includes('thermal') || 
        name.toLowerCase().includes('pos') ||
        name.toLowerCase().includes('receipt')
      );
      
      if (thermalPrinterNames.length > 0) {
        setSelectedPrinter(thermalPrinterNames[0]);
      } else if (availablePrinters.length > 0) {
        setSelectedPrinter(availablePrinters[0]);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
      setIsConnected(false);
      toast.error('Failed to connect to QZ Tray. Please ensure it is running.');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('printerSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSelectedPrinter(settings.name || '');
      setPaperWidth(settings.paperWidth || 80);
      setCopies(settings.copies || 1);
    }

    const savedBusinessInfo = localStorage.getItem('businessInfo');
    if (savedBusinessInfo) {
      setBusinessInfo(JSON.parse(savedBusinessInfo));
    }
  };

  const saveSettings = () => {
    const settings = {
      name: selectedPrinter,
      paperWidth,
      copies
    };

    // Save to localStorage
    localStorage.setItem('printerSettings', JSON.stringify(settings));
    localStorage.setItem('businessInfo', JSON.stringify(businessInfo));

    // Update thermal printer service
    thermalPrinter.setPrinter(selectedPrinter);
    thermalPrinter.updatePrinterSettings(settings);
    thermalPrinter.updateBusinessInfo(businessInfo);

    toast.success('Printer settings saved successfully!');
    onSave && onSave(settings);
    onClose();
  };

  const testPrint = async () => {
    if (!selectedPrinter) {
      toast.error('Please select a printer first');
      return;
    }

    try {
      setIsTesting(true);
      
      // Update printer settings before test
      thermalPrinter.setPrinter(selectedPrinter);
      thermalPrinter.updatePrinterSettings({ paperWidth, copies });
      thermalPrinter.updateBusinessInfo(businessInfo);

      await thermalPrinter.testPrint();
      toast.success('Test receipt printed successfully!');
    } catch (error) {
      console.error('Test print failed:', error);
      toast.error(`Test print failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaPrint className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Printer Settings</h2>
                <p className="text-sm opacity-90">Configure thermal POS printer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* QZ Tray Installation and Troubleshooting */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">QZ Tray Required</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>To use thermal printing, you need to install QZ Tray:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Download QZ Tray from <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-medium">qz.io/download</a></li>
                    <li>Install and run the QZ Tray application</li>
                    <li>Connect your thermal printer (ESC/POS compatible)</li>
                    <li>Return here to configure printer settings</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Connection Failed</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    QZ Tray is not running. Please start the QZ Tray application and click "Test Connection" below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="mb-6 p-4 rounded-lg border-2 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  QZ Tray Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {!isConnected && (
                <button
                  onClick={loadPrinters}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Reconnect'}
                </button>
              )}
            </div>
            {!isConnected && (
              <div className="mt-2 text-sm text-amber-600 flex items-center space-x-2">
                <FaExclamationTriangle />
                <span>Please ensure QZ Tray is installed and running</span>
              </div>
            )}
          </div>

          {/* Printer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Printer
            </label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isConnected}
            >
              <option value="">Choose a printer...</option>
              {printers.map((printer) => (
                <option key={printer} value={printer}>
                  {printer}
                </option>
              ))}
            </select>
          </div>

          {/* Printer Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paper Width
              </label>
              <select
                value={paperWidth}
                onChange={(e) => setPaperWidth(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={58}>58mm</option>
                <option value={80}>80mm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Copies
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaCog className="mr-2 text-gray-600" />
              Business Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Restaurant Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Your Restaurant Address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="info@restaurant.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  value={businessInfo.gst}
                  onChange={(e) => setBusinessInfo({...businessInfo, gst: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="GST No: XXXXXXXXX"
                />
              </div>
            </div>
          </div>
        

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={testPrint}
            disabled={!selectedPrinter || isTesting}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FaPrint className="text-sm" />
            <span>{isTesting ? 'Testing...' : 'Test Print'}</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
            >
              <FaCheck className="text-sm" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterSettingsModal;

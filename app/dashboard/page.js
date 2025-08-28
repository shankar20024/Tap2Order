"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAbly } from "@/lib/ably";
import { 
  FaUtensils, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaBell, 
  FaListAlt, 
  FaClipboardList, 
  FaHistory, 
  FaTable, 
  FaSync,
  FaPrint,
  FaChartLine,
  FaUsers,
  FaCog,
  FaEye,
  FaPlus,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
  FaTachometerAlt,
  FaFire,
  FaConciergeBell
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import TableDetailsModal from "@/app/components/TableDetailsModal";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertPing from "../components/AlertPing";
import Header from "../components/Header";
import NavButton from "../components/NavButton";
import LogoutButton from "../components/Logout";
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import thermalPrinter from "@/lib/thermalPrinter";

// Modern Stats Card Component with Advanced Visual Effects
const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", className = "" }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/30",
    green: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white shadow-emerald-500/30",
    amber: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-amber-500/30",
    red: "bg-gradient-to-br from-red-500 via-pink-600 to-rose-700 text-white shadow-red-500/30",
    purple: "bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white shadow-purple-500/30",
    indigo: "bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 text-white shadow-indigo-500/30"
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-90 mb-1 truncate">{title}</p>
          <p className="text-lg font-bold mb-1 truncate">{value}</p>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <FaArrowUp className="text-xs text-green-200" />
              ) : (
                <FaArrowDown className="text-xs text-red-200" />
              )}
              <span className="text-xs opacity-80">{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="ml-2 flex-shrink-0">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="text-base" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Quick Actions with Stunning Effects
const QuickActions = ({ onRefresh, onViewHistory, onManageTables, onViewAnalytics, onViewWaiter, className = "" }) => (
  <div className={`bg-white rounded-3xl shadow-2xl border-0 overflow-hidden ${className} backdrop-blur-lg scale-90`}>
    <div className="bg-gradient-to-r from-slate-800 via-gray-900 to-black px-4 sm:px-6 py-4 border-b-0">
      <h3 className="text-lg sm:text-xl font-black text-white flex items-center">
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-3 shadow-lg animate-pulse">
          <FaTachometerAlt className="text-white text-base sm:text-lg" />
        </div>
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Quick Actions
        </span>
      </h3>
    </div>
    
    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={onRefresh}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-blue-500 to-cyan-600 text-white
                   hover:from-blue-600 hover:to-cyan-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-blue-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:rotate-180">
            <FaSync className="text-lg sm:text-xl group-hover:animate-spin" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Refresh Data
          </span>
        </button>
        
        <button
          onClick={onViewHistory}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-emerald-500 to-teal-600 text-white
                   hover:from-emerald-600 hover:to-teal-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-emerald-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-110">
            <FaHistory className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Order History
          </span>
        </button>
        
        <button
          onClick={onManageTables}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-amber-500 to-orange-600 text-white
                   hover:from-amber-600 hover:to-orange-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-amber-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:rotate-12">
            <FaTable className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Manage Tables
          </span>
        </button>
        
        <button
          onClick={onViewAnalytics}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-purple-500 to-pink-600 text-white
                   hover:from-purple-600 hover:to-pink-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-purple-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-125">
            <FaChartLine className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Analytics
          </span>
        </button>
        
        <button
          onClick={onViewWaiter}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white
                   hover:from-rose-600 hover:to-fuchsia-700 transition-all duration-500 
                   hover:shadow-2xl hover:scale-110 hover:-translate-y-2 active:scale-95
                   shadow-lg shadow-rose-500/30"
        >
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all duration-300 mb-3 group-hover:scale-110">
            <FaConciergeBell className="text-lg sm:text-xl" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-center">
            Waiter View
          </span>
        </button>
      </div>
    </div>
  </div>
);


// Modern Minimal Order Card Component
const OrderCard = ({ order, onComplete, onCancel, onPrint }) => {
  const items = order.items || order.cart || [];
  const specialInstructions = order.message || order.msg || order.specialInstructions;
  const totalAmount = order.totalAmount || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const statusConfig = {
    pending: {
      color: "bg-amber-50 border-amber-200 text-amber-800",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: FaClock,
      iconColor: "text-amber-600"
    },
    preparing: {
      color: "bg-blue-50 border-blue-200 text-blue-800", 
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      icon: FaUtensils,
      iconColor: "text-blue-600"
    },
    ready: {
      color: "bg-emerald-50 border-emerald-200 text-emerald-800",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200", 
      icon: FaCheckCircle,
      iconColor: "text-emerald-600"
    },
    served: {
      color: "bg-purple-50 border-purple-200 text-purple-800",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      icon: FaBell,
      iconColor: "text-purple-600"
    }
  };

  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Clean Header */}
      <div className={`${config.color} px-4 py-3 border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-white px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 shadow-sm">
              #{order._id?.slice(-6) || 'N/A'}
            </span>
            <div className="flex items-center space-x-1 text-sm font-medium">
              <FaTable className={`${config.iconColor} text-xs`} />
              <span>Table {order.tableNumber}</span>
            </div>
          </div>
          <div className={`${config.badge} px-3 py-1 rounded-full text-xs font-medium border-2`}>
            <StatusIcon className="text-xs" />
            <span className="capitalize">{order.status}</span>
          </div>
        </div>
        <div className="mt-2 text-xs opacity-75">
          {new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })} • {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}
        </div>
      </div>

      {/* Special Instructions */}
      {specialInstructions && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-start space-x-2">
            <FaBell className="text-yellow-600 text-sm mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions</p>
              <p className="text-sm text-yellow-700 leading-relaxed">{specialInstructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {items.length > 0 ? (
            items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {/* Individual item status */}
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      (item.status || order.status) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      (item.status || order.status) === 'preparing' ? 'bg-blue-100 text-blue-700' :
                      (item.status || order.status) === 'ready' ? 'bg-green-100 text-green-700' : 
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {item.status || order.status}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 ml-3">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No items in this order</p>
          )}
          {items.length > 3 && (
            <div className="text-center py-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">+{items.length - 3} more items</span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-gray-900">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <button
            onClick={() => onPrint(order)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            title="Print Order"
          >
            <FaPrint className="text-sm" />
          </button>
        </div>
        
        <div className="flex space-x-2">
          {order.status === 'ready' && (
            <button
              onClick={() => onComplete(order._id)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
            >
              <FaCheckCircle className="text-xs" />
              <span>Complete</span>
            </button>
          )}
          {(order.status === 'pending' || order.status === 'preparing') && (
            <button
              onClick={() => onCancel(order._id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
            >
              <FaTimesCircle className="text-xs" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Professional Bill Card Component
const BillCard = ({ tableNumber, orders, onPrintBill, onCompleteBill }) => {
  const items = orders.flatMap(o => (o.items || o.cart || []));
  const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  return (
    <div className="bg-white rounded-3xl shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 overflow-hidden backdrop-blur-lg">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-200 rounded-lg mr-3">
              <FaTable className="text-amber-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Table {tableNumber}</h2>
              <p className="text-xs text-gray-600">Ready for billing</p>
            </div>
          </div>
          <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
            {orders.length} served
          </span>
        </div>
      </div>
      
      <div className="p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-colors duration-200 hover:scale-105">
              <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="text-sm font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          {items.length > 5 && (
            <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-200 bg-gray-50 rounded-lg">
              <FaPlus className="inline mr-1" />
              {items.length - 5} more items
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-black flex items-center bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            <FaRupeeSign className="text-xl mr-2 text-green-400 animate-pulse" />
            {total}
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            Total Amount
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => onPrintBill(tableNumber, items, total)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 
                     text-white py-4 px-6 rounded-2xl text-sm font-black transition-all duration-500 
                     flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
          >
            <FaPrint className="mr-2" />
            Print Bill
          </button>
          <button
            onClick={() => onCompleteBill(orders)}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 
                     text-white py-4 px-6 rounded-2xl text-sm font-black transition-all duration-500 
                     flex items-center justify-center shadow-2xl hover:shadow-green-500/50 hover:scale-105"
          >
            <FaCheckCircle className="mr-2" />
            Complete
          </button>
        </div>
      </div>
    </div>
  );
};

// Advanced Filter and Search Component
const FilterSearchBar = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, orderCount }) => (
  <div className="bg-white rounded-3xl shadow-2xl border-0 p-6 mb-6 backdrop-blur-lg">
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by table, order ID, or item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
      </div>
      
      {/* Status Filter */}
      <div className="relative">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-2xl px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
        >
          <option value="all">All Status ({orderCount})</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <FaFilter className="text-gray-400" />
        </div>
      </div>
    </div>
  </div>
);

// Utility function to group orders by table number
function groupOrdersByTable(orders) {
  return orders.reduce((acc, order) => {
    if (!acc[order.tableNumber]) acc[order.tableNumber] = [];
    acc[order.tableNumber].push(order);
    return acc;
  }, {});
}

// TableBox - compact 100px table card
const TableBox = ({ tableNumber, totalAmount, hasOrders, hasPaid, onView, onPrint, onCancel, onMarkPaid, gstDetails }) => (
  <div className="flex flex-col items-center p-2">
    <div
      onClick={hasOrders ? onView : undefined}
      className={`relative w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-300 transform hover:scale-105 ${
        hasPaid
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-300/30'
          : hasOrders
            ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg shadow-orange-200/50 cursor-pointer hover:shadow-xl hover:shadow-orange-300/60 ring-2 ring-orange-300/30'
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 shadow-md hover:shadow-lg'
      }`}
    >
      {/* Status indicator dot */}
      <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
        hasPaid ? 'bg-emerald-500' : hasOrders ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
      }`}></div>
      
      <div className="text-lg font-bold text-gray-800 mb-1 flex items-center">
        <span className="text-blue-600">T</span>
        <span className="ml-1">{tableNumber}</span>
      </div>
      
      <div className={`text-center mb-4 ${
        hasPaid ? 'text-emerald-700' : hasOrders ? 'text-orange-700' : 'text-gray-600'
      }`}>
        <div className="text-xs font-medium opacity-80 mb-1">
          {gstDetails && gstDetails.isGstApplicable ? 'Total Amount' : 'Total Amount'}
        </div>
        <div className="text-base font-bold">
          ₹{(gstDetails && gstDetails.grandTotal > 0 
            ? gstDetails.grandTotal 
            : totalAmount
          ).toLocaleString('en-IN')}
        </div>
      </div>
      
      {/* Status badge */}
      <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium ${
        hasPaid 
          ? 'bg-emerald-200 text-emerald-800' 
          : hasOrders 
            ? 'bg-orange-200 text-orange-800' 
            : 'bg-gray-200 text-gray-600'
      }`}>
        {hasPaid ? 'Paid' : hasOrders ? 'Active' : 'Empty'}
      </div>
    </div>
    
    {/* Bottom action section */}
    <div className="mt-3 w-32">
      <button
        onClick={onCancel}
        title="Cancel All Orders"
        disabled={!hasOrders}
        className={`w-full h-10 rounded-xl border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
          hasOrders
            ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-400 shadow-md hover:shadow-lg'
            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
      >
        <FaTimesCircle className="text-sm" />
        <span>Cancel</span>
      </button>
    </div>
  </div>
);

// Main Dashboard Component
export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrderTables, setNewOrderTables] = useState([]);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [billOrders, setBillOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableModal, setTableModal] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();
  const refreshTimerRef = useRef(null);

  // Enhanced Stats calculation with trends - Updated to count items instead of orders
  const stats = {
    totalItems: [...orders, ...billOrders].reduce((sum, o) => sum + (o.items || o.cart || []).length, 0),
    pendingItems: orders.reduce((sum, o) => {
      if (o.status === 'pending') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'pending').length;
    }, 0),
    preparingItems: orders.reduce((sum, o) => {
      if (o.status === 'preparing') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'preparing').length;
    }, 0),
    readyItems: orders.reduce((sum, o) => {
      if (o.status === 'ready') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'ready').length;
    }, 0),
    servedItems: [...orders, ...billOrders].reduce((sum, o) => {
      if (o.status === 'served') return sum + (o.items || o.cart || []).length;
      return sum + (o.items || o.cart || []).filter(item => item.status === 'served').length;
    }, 0),
    totalRevenue: [...orders, ...billOrders].reduce((sum, o) => {
      // Use GST grandTotal if available, otherwise fall back to totalAmount
      if (o.gstDetails && o.gstDetails.isGstApplicable && o.gstDetails.grandTotal > 0) {
        return sum + o.gstDetails.grandTotal;
      }
      // Fallback to calculating from items if no totalAmount
      const items = o.items || o.cart || [];
      return sum + (o.totalAmount || items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0));
    }, 0),
    activeTables: new Set([...orders.map(o => o.tableNumber), ...billOrders.map(o => o.tableNumber)]).size
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const client = getAbly();
    if (!client) return;

    // Subscribe to both specific and global channels (QR page may publish to either)
    const channels = [
      client.channels.get(`orders:${session.user.id}`),
      client.channels.get('orders')
    ];
    const events = ['order:created','order:updated','order:paid','order:cancelled','order:deleted'];
    const onMsg = () => scheduleRefresh();
    channels.forEach(ch => events.forEach(evt => ch.subscribe(evt, onMsg)));

    // Immediate fetch to sync
    fetchOrders();

    return () => {
      channels.forEach(ch => events.forEach(evt => ch.unsubscribe(evt, onMsg)));
    };
  }, [session?.user?.id]);

  // Refresh when tab becomes visible + 12s polling fallback
  useEffect(() => {
    if (!session?.user?.id) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') scheduleRefresh(0);
    };
    document.addEventListener('visibilitychange', onVis);
    const poll = setInterval(() => scheduleRefresh(0), 12000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(poll);
    };
  }, [session?.user?.id]);

  const handleRealtimeOrderUpdate = (eventType, data) => {
    if (!data) return;

    const normalized = {
      _id: data._id || data.id,
      tableNumber: data.tableNumber,
      items: data.items || data.cart || [],
      status: data.status,
      paymentStatus: data.paymentStatus,
      totalAmount: data.totalAmount,
      createdAt: data.createdAt || data.timestamp,
      message: data.message || data.msg
    };

    if (eventType === 'order.created' || eventType === 'order-created') {
      setOrders(prev => {
        const exists = prev.some(o => o._id === normalized._id);
        if (exists) return prev;
        
        setNewOrderTables(prevTables => {
          if (!prevTables.includes(normalized.tableNumber)) {
            setHasNewOrder(true);
            setTimeout(() => setHasNewOrder(false), 5000);
            return [...prevTables, normalized.tableNumber];
          }
          return prevTables;
        });
        
        return [normalized, ...prev];
      });
      return;
    }

    if (eventType === 'order.updated' || eventType === 'order-updated') {
      if (normalized.status === 'served' && normalized.paymentStatus !== 'paid') {
        setOrders(prev => prev.filter(o => o._id !== normalized._id));
        setBillOrders(prev => {
          const exists = prev.some(o => o._id === normalized._id);
          return exists ? prev.map(o => (o._id === normalized._id ? normalized : o)) : [...prev, normalized];
        });
        return;
      }
      if (normalized.status === 'completed' || normalized.status === 'cancelled') {
        setOrders(prev => prev.filter(o => o._id !== normalized._id));
        setBillOrders(prev => prev.filter(o => o._id !== normalized._id));
        return;
      }
      setOrders(prev => prev.map(o => (o._id === normalized._id ? { ...o, ...normalized } : o)));
      return;
    }

    if (eventType === 'order.deleted') {
      setOrders(prev => prev.filter(o => o._id !== normalized._id));
      setBillOrders(prev => prev.filter(o => o._id !== normalized._id));
      return;
    }
  };

  const fetchOrders = async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      let authHeaders = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/order?userId=${session.user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // Filter out cancelled orders at fetch level - don't fetch them at all
      const filteredData = data.filter(o => o.status !== 'cancelled');
      setOrders(filteredData);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
          ...(typeof window !== 'undefined' ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {})
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

      const updatedOrder = await response.json();

      const client = getAbly();
      if (client) {
        const channel = client.channels.get(`orders:${session.user.id}`);
        const payload = {
          ...updatedOrder,
          timestamp: Date.now()
        };
        await channel.publish("order.updated", payload);
        await channel.publish("order-updated", payload);
      }
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "cancelled" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }

      const updatedOrder = await response.json();

      const client = getAbly();
      if (client) {
        const channel = client.channels.get(`orders:${session.user.id}`);
        const payload = {
          ...updatedOrder,
          timestamp: Date.now()
        };
        await channel.publish("order.updated", payload);
        await channel.publish("order-updated", payload);
      }
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const thermalPrintBill = async (tableNumber, items, total, orderIds, orders) => {
    try {
      // Quick check for printer availability without triggering permissions
      const isAvailable = await thermalPrinter.checkPrinterAvailability();
      
      if (isAvailable) {
        // Try to connect (will use cached permission if already granted)
        await thermalPrinter.connect();
        const printers = await thermalPrinter.getPrinters();
        
        if (printers.length > 0) {
          // Direct thermal printing - skip preview
          
          // Get customer name from orders
          const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
            ? orders[0].customerInfo.name 
            : 'Walk-in Customer';

          // Generate bill number
          const billNumberResponse = await fetch('/api/bill-number', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          let billNumber = 1;
          if (billNumberResponse.ok) {
            const billData = await billNumberResponse.json();
            billNumber = billData.billNumber;
          }

          // Fetch business info for receipt
          const profileResponse = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          });
          
          let businessInfo = null;
          if (profileResponse.ok) {
            businessInfo = await profileResponse.json();
          }

          // Prepare receipt data with same format as preview
          const receiptData = {
            tableNumber: parseInt(tableNumber),
            orderIds: orderIds || [],
            items: items,
            total: parseFloat(total),
            itemsTotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            customerName: customerName,
            timestamp: Date.now(),
            billNumber: billNumber,
            businessInfo: businessInfo
          };

          // Print directly using thermal printer
          await thermalPrinter.printReceipt(receiptData);
          toast.success('Bill printed successfully!');
          return;
        }
      }
    } catch (error) {
      // Don't show error toast, just fall back to preview silently
    }

    // Fallback to preview if thermal printing fails or not available
    const itemsParam = encodeURIComponent(JSON.stringify(items));
    const ordersParam = (orderIds || []).join(',');
    
    // Get customer name from orders
    const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
      ? orders[0].customerInfo.name 
      : 'Walk-in Customer';
    
    const url = `/bill-preview?table=${tableNumber}&items=${itemsParam}&total=${total}&orders=${ordersParam}&customer=${encodeURIComponent(customerName)}`;
    router.push(url);
  };

  const fallbackBrowserPrint = (tableNumber, items, total, orderIds, orders) => {
    // Also redirect to bill preview for consistency
    const itemsParam = encodeURIComponent(JSON.stringify(items));
    const ordersParam = (orderIds || []).join(',');
    
    // Get customer name from orders
    const customerName = orders && orders.length > 0 && orders[0].customerInfo?.name 
      ? orders[0].customerInfo.name 
      : 'Walk-in Customer';
    
    const url = `/bill-preview?table=${tableNumber}&items=${itemsParam}&total=${total}&orders=${ordersParam}&customer=${encodeURIComponent(customerName)}`;
    router.push(url);
  };

  const markOrderPaid = async (orderId, gstDetails) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/order/${orderId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        gstDetails: gstDetails
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to mark order paid (${res.status}): ${text}`);
    }
    return res.json();
  };

  const cancelTableOrders = async (tableNumber, tableOrders) => {
    try {
      const active = tableOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      if (active.length === 0) return;
      await Promise.all(active.map(o => cancelOrder(o._id)));
      toast.success(`Cancelled ${active.length} order(s) for Table ${tableNumber}`);
      await fetchOrders();
    } catch (e) {
      toast.error('Failed to cancel orders');
    }
  };

  const markTablePaid = async (tableNumber, tableOrders, allOrdersForTable, gstDetails) => {
    try {
      // consider all non-cancelled & not already paid orders
      const candidates = (allOrdersForTable || tableOrders).filter(o => o.status !== 'cancelled' && !isOrderPaid(o));
      
      if (candidates.length === 0) {
        toast.info(`All orders already paid for Table ${tableNumber}`);
        return;
      }
      await Promise.all(candidates.map(o => markOrderPaid(o._id, gstDetails)));
      toast.success(`Marked ${candidates.length} order(s) paid for Table ${tableNumber}`);
      await fetchOrders();
    } catch (e) {
      toast.error('Failed to mark orders paid');
    }
  };

  const getOrderTableKey = (o) => {
    const t = o?.table;
    // Handle nested table objects or direct fields
    const candidate = (
      o?.tableNumber ??
      (typeof t === 'object' ? (t?.number ?? t?.name ?? t?.id ?? t?._id) : t) ??
      o?.table_no ??
      o?.tableId ??
      o?.table_id ??
      o?.tableNo ??
      o?.table_name
    );
    return candidate != null ? String(candidate) : '';
  };

  const isOrderPaid = (o) => {
    // Only hide orders when both status is 'completed' AND paymentStatus is 'paid'
    return o?.status === 'completed' && o?.paymentStatus === 'paid';
  };

  const refreshPrinters = async () => {
    try {
      const printers = await thermalPrinter.getAvailablePrinters();
      setAvailablePrinters(printers);
    } catch (error) {
      // Don't show error toast, just fall back to preview silently
    }
  };

  const handlePrinterChange = (printerName) => {
    setSelectedPrinter(printerName);
    thermalPrinter.setPrinter(printerName);
    toast.success(`Printer selected: ${printerName}`);
  };

  const scheduleRefresh = (delay = 400) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      fetchOrders();
    }, delay);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      <Header />
      
      {/* Main Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
        
        {/* Modern Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center mb-6 lg:mb-0">
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-4 rounded-3xl mr-0 sm:mr-6 mb-4 sm:mb-0 self-start">
              <FaUtensils className="text-white text-2xl sm:text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Restaurant Dashboard
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Manage your orders and operations efficiently
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <FaFire className="mr-2 text-orange-500" />
                <span>Real-time updates enabled</span>
              </div>
            </div>
          </div>
          
          {/* Printer Selection Section */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FaPrint className="text-blue-600 mr-3 text-xl" />
                <h3 className="text-lg font-semibold text-gray-800">Thermal Printer</h3>
              </div>
              <button
                onClick={refreshPrinters}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                title="Refresh Printers"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {availablePrinters.length > 0 ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Printer:
                </label>
                <select
                  value={selectedPrinter || ''}
                  onChange={(e) => handlePrinterChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                >
                  <option value="">Choose a printer...</option>
                  {availablePrinters.map((printer, index) => (
                    <option key={index} value={printer.name}>
                      {printer.name} {printer.name === selectedPrinter ? '(Selected)' : ''}
                    </option>
                  ))}
                </select>
                
                {selectedPrinter && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ready to print to: {selectedPrinter}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <FaPrint className="mx-auto text-gray-400 text-3xl mb-2" />
                <p className="text-gray-500 text-sm">No printers found</p>
                <button
                  onClick={() => setShowPrinterSettings(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Configure Printer Settings
                </button>
              </div>
            )}
          </div>
          
          {/* New Order Alert */}
          {hasNewOrder && (
            <div className="flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 
                          px-4 sm:px-6 py-3 rounded-2xl border-2 border-green-200 shadow-2xl animate-pulse">
              <AlertPing className="mr-3" />
              <div>
                <span className="font-bold text-sm sm:text-base">New Orders!</span>
                <p className="text-xs sm:text-sm opacity-80">Fresh orders received</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions Panel */}
        <div className="mb-6">
          <QuickActions
            onRefresh={() => window.location.reload()}
            onViewHistory={() => router.push('/order-history')}
            onManageTables={() => router.push('/table')}
            onViewAnalytics={() => router.push('/analytics')}
            onViewWaiter={() => window.open('/waiter', '_blank', 'noopener,noreferrer')}
          />
        </div>

        {/* Enhanced Stats Cards Grid - Fully Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <StatsCard
            title="Total Items"
            value={stats.totalItems}
            icon={FaClipboardList}
            color="blue"
          />
          <StatsCard
            title="Pending Items"
            value={stats.pendingItems}
            icon={FaClock}
            color="amber"
          />
          <StatsCard
            title="Preparing Items"
            value={stats.preparingItems}
            icon={FaUtensils}
            color="indigo"
          />
          <StatsCard
            title="Ready Items"
            value={stats.readyItems}
            icon={FaCheckCircle}
            color="green"
          />
          <StatsCard
            title="Served Items"
            value={stats.servedItems}
            icon={FaBell}
            color="purple"
          />
          <StatsCard
            title="Active Tables"
            value={stats.activeTables}
            icon={FaTable}
            color="green"
          />
          <StatsCard
            title="Revenue"
            value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
            icon={FaRupeeSign}
            color="purple"
          />
        </div>

        {/* Table Management Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><FaTable className="mr-2 text-blue-600"/>Tables</h2>
            <div className="text-xs text-gray-500">{Object.keys(groupOrdersByTable(orders)).length} active</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 min-h-[300px] h-auto overflow-hidden">
            {Object.keys(groupOrdersByTable(orders)).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full mb-4">
                  <FaTable className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Tables</h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  Tables with active orders will appear here. Start taking orders to see table activity.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FaUtensils className="text-amber-500" />
                  <span>Ready to serve your customers</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 sm:gap-8 lg:gap-10 auto-rows-max">
                {Object.keys(groupOrdersByTable(orders)).map((tn) => {
              const ordersForTable = groupOrdersByTable(orders)[tn];
              // Debug: Log orders for this table
              
              
              // Show all orders except those that are completed AND paid
              const activeOrders = ordersForTable.filter(o => !isOrderPaid(o));
              
              const total = activeOrders.reduce((sum, o)=> sum + (o.totalAmount || (o.items||o.cart||[]).reduce((s,i)=>s+i.price*i.quantity,0)), 0);
              const hasOrders = activeOrders.length > 0;
              const hasPaid = false; // Since we're showing all non-completed orders
              
              // Only render table if it has active orders
              if (!hasOrders) return null;
              
              return (
                <TableBox
                  key={tn}
                  tableNumber={tn}
                  totalAmount={total}
                  hasOrders={hasOrders}
                  hasPaid={hasPaid}
                  onView={() => setTableModal({ tableNumber: tn, orders: activeOrders })}
                  onPrint={() => thermalPrintBill(tn, activeOrders.flatMap(order => order.items || order.cart || []), total, activeOrders.map(o => o._id), activeOrders)}
                  onCancel={() => cancelTableOrders(tn, activeOrders)}
                  onMarkPaid={() => markTablePaid(tn, activeOrders, activeOrders, ordersForTable[0]?.gstDetails)}
                  gstDetails={ordersForTable[0]?.gstDetails}
                />
              );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard content area ready for new sections */}
        <div className="space-y-6">
          {/* Content will be added here as per user requirements */}
        </div>
        {tableModal && (
          <TableDetailsModal 
            tableNumber={tableModal.tableNumber} 
            orders={tableModal.orders} 
            onClose={() => setTableModal(null)} 
            onPrint={() => thermalPrintBill(tableModal.tableNumber, tableModal.orders.flatMap(order => order.items || order.cart || []), tableModal.orders.reduce((sum, o) => sum + (o.totalAmount || (o.items||o.cart||[]).reduce((s,i)=>s+i.price*i.quantity,0)), 0), tableModal.orders.map(o => o._id), tableModal.orders)}
            onMarkPaid={(gstDetails) => {
              markTablePaid(tableModal.tableNumber, tableModal.orders, tableModal.orders, gstDetails);
              setTableModal(null);
            }}
            userProfile={session?.user}
          />
        )}
        {showPrinterSettings && (
          <PrinterSettingsModal
            isOpen={showPrinterSettings}
            onClose={() => setShowPrinterSettings(false)}
            onSave={(settings) => {
              // Reinitialize printer with new settings
              initializePrinter();
            }}
          />
        )}
      </div>
    </div>
  );
}

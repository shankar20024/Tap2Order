import React from 'react';
import { FiClock, FiRefreshCw, FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp, FiPrinter, FiEdit, FiTrash2 } from 'react-icons/fi';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'served': return 'bg-green-100 text-green-800 border-green-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending': return <FiClock className="w-4 h-4" />;
    case 'preparing': return <FiRefreshCw className="w-4 h-4" />;
    case 'served': return <FiCheck className="w-4 h-4" />;
    case 'completed': return <FiCheck className="w-4 h-4" />;
    case 'cancelled': return <FiAlertCircle className="w-4 h-4" />;
    default: return <FiClock className="w-4 h-4" />;
  }
};

const ServedOrderCard = ({ order, expandedOrderId, toggleExpand, handlePrintOrder, isOrderPaid, tabType }) => {
  const { tableNumber, items, status, createdAt, customerInfo, specialRequests, orderType } = order;
  const isExpanded = expandedOrderId === order._id;

  const servedItems = items.filter(item => item.status === 'served');

  if (tabType === 'served' && servedItems.length === 0) {
    return null; // Don't render if no served items for this tab
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
      {/* Card Header */}
      <div 
        className={`flex items-center justify-between p-4 rounded-t-xl cursor-pointer ${orderType === 'beverages' ? 'bg-blue-50' : 'bg-gray-50'}`}
        onClick={() => toggleExpand(order._id)}
      >
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-gray-800">T-{tableNumber}</div>
          <div className="text-sm text-gray-600">{servedItems.length} Items</div>
          {orderType === 'beverages' && <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Beverages</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          {isExpanded ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Customer & Time Info */}
          <div className="flex justify-between items-start mb-4 text-sm">
            <div>
              <p className="font-semibold text-gray-800">{customerInfo?.name || 'Walk-in'}</p>
              <p className="text-gray-500">{new Date(createdAt).toLocaleTimeString()}</p>
            </div>
           
          </div>

          {/* Special Requests */}
          {specialRequests && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded-r-lg mb-4 text-sm">
              <strong>Notes:</strong> {specialRequests}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            {servedItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">{item.quantity} x {item.name} {item.size && `(${item.size})`}</p>
                  {item.notes && <p className="text-xs text-gray-500">Note: {item.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServedOrderCard;

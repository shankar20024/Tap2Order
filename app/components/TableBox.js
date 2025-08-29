"use client";
import { FaTimesCircle } from "react-icons/fa";

const TableBox = ({ tableNumber, totalAmount, hasOrders, hasPaid, onView, onCancel, onMarkPaid, gstDetails }) => (
  <div className="flex flex-col items-center sm:p-6 lg:p-2 md:p-2 px-6 ">
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
          Total Amount
        </div>
        <div className="text-base font-bold">
          ₹{totalAmount.toLocaleString('en-IN')}
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

export default TableBox;

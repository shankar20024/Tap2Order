"use client";
import { FaTimesCircle, FaExclamationCircle } from "react-icons/fa";
import { useState } from 'react';

const TableBox = ({ tableNumber, totalAmount, hasOrders, hasPaid, onView, onCancel, onMarkPaid, gstDetails }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancelClick = (e) => {
    e.stopPropagation(); 
    setShowConfirm(true);
  };

  const confirmCancel = (e) => {
    e.stopPropagation();
    onCancel();
    setShowConfirm(false);
  };

  const closeConfirm = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="flex flex-col items-center p-1 xs:p-2 sm:p-3 md:p-4 lg:p-2 xl:p-3 2xl:p-4">
      <div
        onClick={hasOrders ? onView : undefined}
        className={`relative 
          w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-28 lg:h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36
          rounded-lg xs:rounded-xl sm:rounded-2xl 
           border
          flex flex-col items-center justify-center 
          p-1 xs:p-2 sm:p-3 
          transition-all duration-300 transform hover:scale-105 ${
          hasPaid
            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-300/30'
            : hasOrders
              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg shadow-orange-200/50 cursor-pointer hover:shadow-xl hover:shadow-orange-300/60 ring-2 ring-orange-300/30'
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 shadow-md hover:shadow-lg'
        }`}
      >
        {/* Status indicator dot - responsive sizing */}
        <div className={`absolute -top-1 -right-1 xs:-top-1.5 xs:-right-1.5 sm:-top-2 sm:-right-2 
          w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 
          rounded-full border border-white xs:border-2 shadow-sm ${
          hasPaid ? 'bg-emerald-500' : hasOrders ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
        
        {/* Table number - responsive typography */}
        <div className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-base xl:text-lg 2xl:text-xl 
          font-bold text-gray-800 mb-0.5 xs:mb-1 flex items-center">
          <span className="text-blue-600">T</span>
          <span className="ml-0.5 xs:ml-1">{tableNumber}</span>
        </div>
        
        {/* Amount section - responsive layout */}
        <div className={`text-center mb-1 xs:mb-2 sm:mb-3 md:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 ${
          hasPaid ? 'text-emerald-700' : hasOrders ? 'text-orange-700' : 'text-gray-600'
        }`}>
          <div className="text-[8px] xs:text-[9px] sm:text-xs md:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 
            font-medium opacity-80 mb-0.5 xs:mb-1">
            Total Amount
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-sm xl:text-base 2xl:text-lg 
            font-bold leading-tight">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
        
        {/* Status badge - responsive positioning and sizing */}
        <div className={`absolute 
          bottom-0.5 xs:bottom-1 sm:bottom-1 
          left-1/2 transform -translate-x-1/2 
          px-1 xs:px-1.5 sm:px-2 
          py-0.5 xs:py-0.5 sm:py-0.5 
          rounded-full 
          text-[8px] xs:text-[9px] sm:text-xs md:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 
          font-medium ${
          hasPaid 
            ? 'bg-emerald-200 text-emerald-800' 
            : hasOrders 
              ? 'bg-orange-200 text-orange-800' 
              : 'bg-gray-200 text-gray-600'
        }`}>
          {hasPaid ? 'Paid' : hasOrders ? 'Active' : 'Empty'}
        </div>
      </div>
      
      {/* Bottom action section - responsive sizing */}
      <div className="mt-1 xs:mt-2 sm:mt-3 
        w-20 xs:w-24 sm:w-28 md:w-32 lg:w-28 xl:w-32 2xl:w-36">
        <button
          onClick={handleCancelClick}
          title="Cancel All Orders"
          disabled={!hasOrders}
          className={`w-full 
            h-6 xs:h-7 sm:h-8 md:h-10 lg:h-8 xl:h-9 2xl:h-10 
            rounded-md xs:rounded-lg sm:rounded-xl 
             border
            font-medium 
            text-[8px] xs:text-[9px] sm:text-xs md:text-sm lg:text-xs xl:text-sm 2xl:text-base 
            transition-all duration-200 flex items-center justify-center 
            space-x-0.5 xs:space-x-1 sm:space-x-2 ${
            hasOrders
              ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-400 shadow-md hover:shadow-lg'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FaTimesCircle className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm lg:text-xs xl:text-sm" />
          <span className="hidden xs:inline sm:inline">Cancel</span>
          
        </button>
      </div>

      {/* Confirmation Modal - responsive sizing */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl z-10" onClick={closeConfirm}>
          <div className="bg-white 
            p-3 xs:p-4 sm:p-6 
            rounded-lg xs:rounded-xl 
            shadow-2xl text-center 
            w-48 xs:w-56 sm:w-64 
            mx-2" 
            onClick={(e) => e.stopPropagation()}>
            <FaExclamationCircle className="text-red-500 
              text-2xl xs:text-3xl sm:text-4xl 
              mx-auto mb-2 xs:mb-3 sm:mb-4" />
            <h3 className="text-sm xs:text-base sm:text-lg 
              font-bold text-gray-800">Are you sure?</h3>
            <p className="text-xs xs:text-sm 
              text-gray-600 my-1 xs:my-2">This will cancel all orders for this table.</p>
            <div className="flex justify-center 
              space-x-2 xs:space-x-3 sm:space-x-4 
              mt-3 xs:mt-4 sm:mt-6">
              <button
                onClick={closeConfirm}
                className="px-2 xs:px-3 sm:px-4 
                  py-1 xs:py-1.5 sm:py-2 
                  rounded-md xs:rounded-lg 
                  bg-gray-200 text-gray-800 hover:bg-gray-300 
                  font-medium transition-colors
                  text-xs xs:text-sm"
              >
                No
              </button>
              <button
                onClick={confirmCancel}
                className="px-2 xs:px-3 sm:px-4 
                  py-1 xs:py-1.5 sm:py-2 
                  rounded-md xs:rounded-lg 
                  bg-red-600 text-white hover:bg-red-700 
                  font-medium transition-colors
                  text-xs xs:text-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableBox;

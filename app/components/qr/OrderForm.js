"use client";

import { useState } from "react";
import { ChatBubbleLeftEllipsisIcon, ShoppingBagIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function OrderForm({ 
  orderMessage, 
  setOrderMessage, 
  onPlaceOrder, 
  onClearCart, 
  totalPrice, 
  cartLength, 
  orderPlaced = false,
  placingOrder = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Total Section */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">Total:</span>
          <span className="text-xl font-bold text-amber-600">
            ₹{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Special Instructions Section */}
      <div className="px-4 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-white rounded-lg 
                   border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Special Instructions
            </span>
            {orderMessage && (
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </div>
          
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded Instructions Input */}
        {isExpanded && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <textarea
              value={orderMessage}
              onChange={(e) => setOrderMessage(e.target.value)}
              placeholder="Any special requests? (e.g., extra spicy, no onions, etc.)"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white 
                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                       text-sm text-gray-700 placeholder-gray-400 resize-none"
              rows="3"
              maxLength="200"
              disabled={orderPlaced}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {orderMessage.length}/200 characters
              </span>
              {orderMessage && (
                <button
                  onClick={() => setOrderMessage('')}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!orderPlaced && (
        <div className="px-4 pb-4 space-y-3">
          {/* Place Order Button */}
          <button
            onClick={onPlaceOrder}
            disabled={cartLength === 0 || placingOrder}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 
                     rounded-xl font-semibold text-white transition-all duration-200 
                     focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:opacity-50 
                     disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600 
                     hover:shadow-lg active:scale-[0.98]"
          >
            {placingOrder ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <ShoppingBagIcon className="w-5 h-5" />
                <span>Place Order</span>
              </>
            )}
          </button>

          {/* Clear Cart Button */}
          <button
            onClick={onClearCart}
            disabled={cartLength === 0 || placingOrder}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 
                     rounded-xl font-medium text-gray-700 bg-white border-2 border-gray-200 
                     hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 
                     focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50 
                     disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        </div>
      )}

      {/* Order Placed Message */}
      {orderPlaced && (
        <div className="px-4 pb-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-800">
                Order placed successfully!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

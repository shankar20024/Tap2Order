"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBagIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function BottomCart({ 
  cart = [], 
  onViewCart,
  isVisible = false 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isVisible || totalItems === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-amber-200 shadow-2xl"
      >
        {/* Clickable Cart Header */}
        <motion.div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 cursor-pointer hover:from-amber-100 hover:to-orange-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ShoppingBagIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Your Order</h3>
                <p className="text-sm text-amber-700">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-amber-900">₹{totalPrice.toFixed(2)}</p>
                <p className="text-xs text-amber-600">Total Amount</p>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUpIcon className="w-5 h-5 text-amber-600" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Expandable Cart Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Cart Items - Display Only */}
              <div className="max-h-32 overflow-y-auto px-4 py-2">
                <div className="space-y-2">
                  {cart.slice(0, 3).map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      layout
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>₹{item.price} × {item.quantity}</span>
                          {item.size && <span>• {item.size}</span>}
                        </div>
                      </div>
                      
                      <div className="ml-3 text-right min-w-0">
                        <p className="font-semibold text-amber-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Show more items indicator */}
                  {cart.length > 3 && (
                    <div className="text-center py-2">
                      <span className="text-sm text-gray-500">+{cart.length - 3} more item{cart.length - 3 > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Cart Button */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewCart}
                  className="w-full bg-white text-amber-600 font-bold py-3 px-4 rounded-xl 
                           hover:bg-amber-50 transition-colors duration-200 
                           flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  <span>View Full Cart & Checkout</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag Handle */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

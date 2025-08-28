"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import CartItem from "./CartItem";
import OrderForm from "./OrderForm";

export default function CartPanel({ 
  isOpen, 
  onClose, 
  cart = [], 
  orderMessage, 
  setOrderMessage, 
  onPlaceOrder, 
  onClearCart, 
  onQuantityDecrease, 
  onQuantityIncrease, 
  onRemoveItem, 
  getTotalPrice, 
  orderPlaced = false,
  placingOrder = false,
  errorMessage = '',
  gstDetails = null
}) {
  const totalPrice = getTotalPrice();
  const cartLength = cart.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: 0.4 
            }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 
                     flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
                {cartLength > 0 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    {cartLength} {cartLength === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close cart"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Cart Content */}
            {cartLength === 0 ? (
              /* Empty Cart State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Browse our delicious menu and add items to get started!
                </p>
              </div>
            ) : (
              /* Cart Items */
              <>
                {/* Scrollable Items List */}
                <div className="flex-1 overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {cart.map(item => (
                      <CartItem
                        key={item.menuItemId}
                        item={item}
                        onQuantityDecrease={onQuantityDecrease}
                        onQuantityIncrease={onQuantityIncrease}
                        onRemove={onRemoveItem}
                        orderPlaced={orderPlaced}
                      />
                    ))}
                  </div>
                </div>

                {/* Order Form */}
                <OrderForm
                  orderMessage={orderMessage}
                  setOrderMessage={setOrderMessage}
                  onPlaceOrder={onPlaceOrder}
                  onClearCart={onClearCart}
                  totalPrice={totalPrice}
                  cartLength={cartLength}
                  orderPlaced={orderPlaced}
                  placingOrder={placingOrder}
                  gstDetails={gstDetails}
                />
              </>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border-t border-red-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium" role="alert">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

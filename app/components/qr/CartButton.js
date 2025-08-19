"use client";

import { useRef, useEffect } from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function CartButton({ 
  totalItemsCount = 0, 
  onClick, 
  showArrow = false, 
  onArrowPositionUpdate 
}) {
  const buttonRef = useRef(null);

  // Update arrow position when cart opens/closes
  useEffect(() => {
    if (buttonRef.current && onArrowPositionUpdate) {
      const updatePosition = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        onArrowPositionUpdate({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [onArrowPositionUpdate]);

  return (
    <div className="fixed top-4 right-4 z-40">
      <div ref={buttonRef} className="relative">
        {/* Main Cart Button */}
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full 
                   shadow-lg hover:shadow-xl flex items-center justify-center 
                   transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300"
          aria-label={`View cart, ${totalItemsCount} items`}
        >
          <ShoppingCartIcon className="w-7 h-7" />
          
          {/* Item Count Badge */}
          <AnimatePresence>
            {totalItemsCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white 
                         text-xs font-bold rounded-full flex items-center justify-center 
                         shadow-md"
                aria-live="polite"
                aria-atomic="true"
              >
                {totalItemsCount > 99 ? '99+' : totalItemsCount}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Animated Arrow Indicator */}
        <AnimatePresence>
          {showArrow && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ 
                opacity: 1, 
                y: [0, 15, 0],
                transition: { 
                  y: { 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  },
                  opacity: { duration: 0.3 }
                }
              }}
              exit={{ opacity: 0 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 
                       pointer-events-none z-50"
            >
              <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg 
                           border border-gray-200 mb-2">
                <span className="text-amber-600 font-semibold text-sm whitespace-nowrap">
                  View Cart
                </span>
              </div>
              
              {/* Arrow SVG */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-amber-500 mx-auto"
              >
                <motion.path 
                  d="M19 14L12 7M12 7L5 14M12 7V21" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  animate={{ 
                    pathLength: [0, 1, 0],
                    transition: { 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }
                  }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

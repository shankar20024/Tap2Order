"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MenuCard from "./MenuCard";

export default function MenuGrid({ 
  filteredMenu = [], 
  loading = false,
  itemQuantities = {},
  selectedSizes = {},
  onSizeSelect,
  onQuantityIncrement,
  onQuantityDecrement,
  onAddToCart,
  orderPlaced = false,
  getPriceForSize,
  activeSection = 'All'
}) {
  const [vegFilter, setVegFilter] = useState(true);
  const [nonVegFilter, setNonVegFilter] = useState(true);
  const [jainFilter, setJainFilter] = useState(true);

  // Check which categories are available in the menu
  const availableCategories = {
    veg: filteredMenu.some(item => item.category === 'veg'),
    nonVeg: filteredMenu.some(item => item.category === 'non-veg'),
    jain: filteredMenu.some(item => item.category === 'jain')
  };

  // Filter menu based on category toggles
  const categoryFilteredMenu = filteredMenu.filter(item => {
    if (item.category === 'veg' && !vegFilter) return false;
    if (item.category === 'non-veg' && !nonVegFilter) return false;
    if (item.category === 'jain' && !jainFilter) return false;
    return true;
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="40" />
      </div>
    );
  }

  if (filteredMenu.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center px-6"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-6 shadow-lg"
        >
          <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-gray-800 mb-3"
        >
          No items found
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 text-sm max-w-sm leading-relaxed"
        >
          {activeSection === 'All' 
            ? "No menu items available at the moment. Please check back later!"
            : `No items found in ${activeSection}. Try selecting a different section or clear your search.`
          }
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="p-3">
      {/* Compact Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeSection === 'All' ? 'All Items' : activeSection}
          </h2>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {categoryFilteredMenu.length} items
          </span>
        </div>

        {/* Compact Category Filter Toggles - Only show available categories */}
        {(availableCategories.veg || availableCategories.nonVeg || availableCategories.jain) && (
          <div className="flex items-center gap-3 mb-3">
            {/* Veg Toggle - Only show if veg items exist */}
            {availableCategories.veg && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVegFilter(!vegFilter)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    vegFilter ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      vegFilter ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border border-green-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Non-Veg Toggle - Only show if non-veg items exist */}
            {availableCategories.nonVeg && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setNonVegFilter(!nonVegFilter)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    nonVegFilter ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      nonVegFilter ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm border border-red-500 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[2px] border-r-[2px] border-b-[3px] 
                                 border-l-transparent border-r-transparent border-b-red-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Jain Toggle - Only show if jain items exist */}
            {availableCategories.jain && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setJainFilter(!jainFilter)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    jainFilter ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      jainFilter ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border border-orange-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" /> 
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Jain</span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Simple Grid Container - No Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-50">
        {categoryFilteredMenu.map((item) => {
          const quantity = itemQuantities[item._id] || 0;
          const selectedSizeIndex = selectedSizes[item._id] || 0;
          
          return (
            <div key={item._id}>
              <MenuCard
                item={item}
                quantity={quantity}
                selectedSizeIndex={selectedSizeIndex}
                onSizeSelect={onSizeSelect}
                onQuantityIncrement={onQuantityIncrement}
                onQuantityDecrement={onQuantityDecrement}
                onAddToCart={onAddToCart}
                orderPlaced={orderPlaced}
                getPriceForSize={getPriceForSize}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import MenuCard from "./MenuCard";
import LoadingSpinner from "@/app/components/LoadingSpinner";

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
  getPriceForSize 
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="40" />
      </div>
    );
  }

  if (filteredMenu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No items found</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          Try adjusting your search or category filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredMenu.map(item => {
          const quantity = itemQuantities[item._id] || 0;
          const selectedSizeIndex = selectedSizes[item._id] || 0;
          
          return (
            <MenuCard
              key={item._id}
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
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredMenu.length} {filteredMenu.length === 1 ? 'item' : 'items'}
        </p>
      </div>
    </div>
  );
}

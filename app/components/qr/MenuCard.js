"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";
import { toast } from 'react-hot-toast';

export default function MenuCard({ 
  item, 
  quantity = 0,
  selectedSizeIndex = 0,
  onSizeSelect,
  onQuantityIncrement,
  onQuantityDecrement,
  onAddToCart,
  orderPlaced = false,
  getPriceForSize 
}) {
  const currentPrice = getPriceForSize(item, selectedSizeIndex);
  const isAvailable = item.available;

  // Handle disabled button click
  const handleDisabledClick = () => {
    if (quantity <= 0) {
      toast.error('Please increase quantity first', {
        duration: 1500,
        position: 'bottom-center',
        style: {
          background: '#ef4444',
          color: 'white',
          fontWeight: '500',
        },
      });
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden 
                   transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 
                   ${!isAvailable ? 'opacity-60' : ''}`}>
      
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Veg/Non-veg Badge & Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Category Badge */}
            {item.category === "veg" ? (
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-green-600 
                           flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-600" />
              </div>
            ) : item.category === "jain" ? (
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-orange-600 
                           flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-orange-600" />
              </div>
            ) : item.category === "none" ? (
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-500 
                           flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-5 h-5 rounded-sm border-2 border-red-500 
                           flex items-center justify-center">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] 
                             border-l-transparent border-r-transparent border-b-red-600" />
              </div>
            )}
            
            {/* Item Name */}
            <h3 className="font-semibold text-lg text-gray-800 truncate">
              {item.name}
            </h3>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-bold text-amber-600">
              ₹{currentPrice.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Subcategory Badge */}
        {item.subcategory && (
          <div className="mb-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              item.category === 'beverages' 
                ? 'bg-blue-100 text-blue-800'
                : item.subcategory === 'desserts'
                ? 'bg-purple-100 text-purple-800'
                : item.subcategory === 'main-course'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1).replace('-', ' ')}
            </span>
          </div>
        )}

        {/* Size Selection */}
        <div className="mb-4">
          <SizeSelector
            item={item}
            selectedSizeIndex={selectedSizeIndex}
            onSizeSelect={onSizeSelect}
            disabled={orderPlaced || !isAvailable}
          />
        </div>

        {/* Availability Status */}
        {!isAvailable && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                           bg-red-100 text-red-800">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="px-4 pb-4">
        {isAvailable ? (
          <div className="flex items-center justify-between gap-3">
            {/* Quantity Selector */}
            <QuantitySelector
              quantity={quantity}
              onIncrement={onQuantityIncrement}
              onDecrement={onQuantityDecrement}
              disabled={orderPlaced}
              itemId={item._id}
              itemName={item.name}
            />

            {/* Add to Cart Button */}
            <button
              onClick={quantity > 0 && !orderPlaced ? () => onAddToCart(item) : handleDisabledClick}
              disabled={false} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold 
                       text-sm transition-all duration-200 min-h-[44px] ${
                quantity > 0 && !orderPlaced
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              aria-disabled={quantity <= 0 || orderPlaced}
              aria-label={`Add ${quantity} ${item.name} to cart`}
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add{quantity > 0 ? ` (${quantity})` : ''}</span>
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold 
                     cursor-not-allowed text-sm"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}

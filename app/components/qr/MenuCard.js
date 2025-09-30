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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden 
                   hover:shadow-md transition-shadow duration-200 
                   ${!isAvailable ? 'opacity-60' : ''}`}>
      
      {/* Compact Card Content */}
      <div className="p-3">
        {/* Header - Name and Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            {/* Compact Category Badge - Only show for food items */}
            {item.category === "veg" ? (
              <div className="flex-shrink-0 w-3 h-3 rounded-full border border-green-600 
                           flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-600" />
              </div>
            ) : item.category === "jain" ? (
              <div className="flex-shrink-0 w-3 h-3 rounded-full border border-orange-600 
                           flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-orange-600" />
              </div>
            ) : item.category === "non-veg" ? (
              <div className="flex-shrink-0 w-3 h-3 rounded-sm border border-red-500 
                           flex items-center justify-center mt-0.5">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] 
                             border-l-transparent border-r-transparent border-b-red-600" />
              </div>
            ) : null}
            
            {/* Compact Item Name */}
            <h3 className="font-medium text-sm text-gray-800 line-clamp-2 flex-1">
              {item.name}
            </h3>
          </div>

          {/* Compact Price */}
          <div className="flex-shrink-0">
            <div className="text-sm font-bold text-orange-600">
              ₹{currentPrice.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Compact Description */}
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
            {item.description}
          </p>
        )}

        {/* Size Selection - Compact */}
        <div className="mb-2">
          <SizeSelector
            item={item}
            selectedSizeIndex={selectedSizeIndex}
            onSizeSelect={onSizeSelect}
            disabled={orderPlaced || !isAvailable}
          />
        </div>

        {/* Availability Status */}
        {!isAvailable && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                           bg-red-100 text-red-700">
              Unavailable
            </span>
          </div>
        )}

        {/* Compact Actions */}
        {isAvailable ? (
          <div className="flex items-center justify-between gap-2">
            {/* Compact Quantity Selector */}
            <QuantitySelector
              quantity={quantity}
              onIncrement={onQuantityIncrement}
              onDecrement={onQuantityDecrement}
              disabled={orderPlaced}
              itemId={item._id}
              itemName={item.name}
            />

            {/* Compact Add Button */}
            <button
              onClick={quantity > 0 && !orderPlaced ? () => onAddToCart(item) : handleDisabledClick}
              disabled={false} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium 
                       text-xs transition-colors ${
                quantity > 0 && !orderPlaced
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PlusIcon className="w-3 h-3" />
              <span>Add{quantity > 0 ? ` (${quantity})` : ''}</span>
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-2 rounded-lg bg-gray-200 text-gray-500 font-medium 
                     cursor-not-allowed text-xs"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}

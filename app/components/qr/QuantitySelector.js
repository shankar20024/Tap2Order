"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function QuantitySelector({ 
  quantity = 0, 
  onIncrement, 
  onDecrement, 
  disabled = false,
  itemId,
  itemName 
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Decrease Button */}
      <button
        onClick={() => onDecrement(itemId)}
        disabled={disabled || quantity === 0}
        aria-label={`Decrease quantity of ${itemName}`}
        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 
                 bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-95 
                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
      >
        <MinusIcon className="w-4 h-4 text-gray-600" />
      </button>

      {/* Quantity Display */}
      <div className="min-w-[40px] text-center">
        <span 
          aria-live="polite" 
          aria-atomic="true" 
          className="text-lg font-bold text-gray-800 select-none"
        >
          {quantity}
        </span>
      </div>

      {/* Increase Button */}
      <button
        onClick={() => onIncrement(itemId)}
        disabled={disabled}
        aria-label={`Increase quantity of ${itemName}`}
        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-amber-200 
                 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 active:scale-95 
                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
      >
        <PlusIcon className="w-4 h-4 text-amber-600" />
      </button>
    </div>
  );
}

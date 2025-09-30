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
    <div className="flex items-center gap-1.5">
      {/* Compact Decrease Button */}
      <button
        onClick={() => onDecrement(itemId)}
        disabled={disabled || quantity === 0}
        aria-label={`Decrease quantity of ${itemName}`}
        className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 
                 bg-white hover:bg-gray-50 transition-colors 
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MinusIcon className="w-3 h-3 text-gray-600" />
      </button>

      {/* Compact Quantity Display */}
      <div className="min-w-[24px] text-center">
        <span 
          aria-live="polite" 
          aria-atomic="true" 
          className="text-sm font-medium text-gray-800 select-none"
        >
          {quantity}
        </span>
      </div>

      {/* Compact Increase Button */}
      <button
        onClick={() => onIncrement(itemId)}
        disabled={disabled}
        aria-label={`Increase quantity of ${itemName}`}
        className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 
                 bg-orange-50 hover:bg-orange-100 transition-colors 
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-3 h-3 text-orange-600" />
      </button>
    </div>
  );
}

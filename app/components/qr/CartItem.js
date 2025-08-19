"use client";

import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function CartItem({ 
  item, 
  onQuantityDecrease, 
  onQuantityIncrease, 
  onRemove, 
  orderPlaced = false 
}) {
  const getItemSubtotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-start gap-3">
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-base leading-tight">
            {item.name}
          </h3>
          
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500">
              ₹{(item.price ?? 0).toFixed(2)} each
            </p>
            
            {item.size && (
              <p className="text-sm text-gray-500">
                Size: <span className="font-medium">{item.size}</span>
              </p>
            )}
            
            <p className="text-sm font-medium text-green-600">
              Subtotal: ₹{getItemSubtotal(item)}
            </p>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityDecrease(item.menuItemId)}
              disabled={orderPlaced}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-full 
                       bg-gray-100 hover:bg-gray-200 active:scale-95 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <MinusIcon className="w-4 h-4 text-gray-600" />
            </button>

            <span 
              aria-live="polite" 
              aria-atomic="true" 
              className="min-w-[32px] text-center font-semibold text-gray-800"
            >
              {item.quantity}
            </span>

            <button
              onClick={() => onQuantityIncrease(item.menuItemId, item.quantity + 1, true)}
              disabled={orderPlaced}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-full 
                       bg-amber-100 hover:bg-amber-200 active:scale-95 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <PlusIcon className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          {/* Remove Button */}
          {!orderPlaced && (
            <button
              onClick={() => onRemove(item.menuItemId)}
              aria-label={`Remove ${item.name} from cart`}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 
                       rounded-full transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

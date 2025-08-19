"use client";

export default function SizeSelector({ 
  item, 
  selectedSizeIndex = 0, 
  onSizeSelect, 
  disabled = false 
}) {
  // Check if item has multiple sizes
  const hasMultipleSizes = item.pricing && Array.isArray(item.pricing) && item.pricing.length > 1;
  
  if (!hasMultipleSizes) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {item.pricing.map((pricing, index) => (
        <button
          key={index}
          onClick={() => onSizeSelect(item._id, index)}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 
                   min-h-[36px] flex items-center justify-center whitespace-nowrap ${
            selectedSizeIndex === index
              ? 'bg-amber-500 text-white border-amber-500 shadow-md transform scale-105'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled}
          title={`${pricing.size} - ₹${pricing.price}`}
          aria-label={`Select ${pricing.size} size for ₹${pricing.price}`}
        >
          <div className="flex flex-col items-center">
            <span className="font-medium">{pricing.size}</span>
            <span className="text-[10px] opacity-75">₹{pricing.price}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

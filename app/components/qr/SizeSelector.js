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
    <div className="flex flex-wrap gap-1">
      {item.pricing.map((pricing, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onSizeSelect(item._id, index);
          }}
          className={`px-2 py-1 text-xs font-medium rounded border transition-colors 
                   flex items-center justify-center whitespace-nowrap ${
            selectedSizeIndex === index
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled}
          title={`${pricing.size} - ₹${pricing.price}`}
          aria-label={`Select ${pricing.size} size for ₹${pricing.price}`}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs">{pricing.size}</span>
            <span className="text-[10px] opacity-75">₹{pricing.price}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

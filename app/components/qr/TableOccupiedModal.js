"use client";

export default function TableOccupiedModal({ isOpen, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Table Occupied</h2>
          
          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message || "This table is currently occupied. Please choose another table."}
          </p>

          {/* Suggestions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-amber-800 mb-2">What you can do:</h3>
            <ul className="text-sm text-amber-700 space-y-1 text-left">
              <li>• Scan QR code of another available table</li>
              <li>• Wait for this table to become available</li>
              <li>• Ask restaurant staff for assistance</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                     text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 
                     focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

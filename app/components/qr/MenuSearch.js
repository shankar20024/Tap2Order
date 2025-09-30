"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function MenuSearch({ 
  searchTerm, 
  setSearchTerm, 
  orderPlaced,
  isSidebarOpen,
  onToggleSidebar 
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-3">
        {/* Simple Search Bar - No Hamburger Menu */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg bg-gray-50
                     focus:outline-none focus:ring-2 focus:border-transparent
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     ${isSearchFocused ? 'border-orange-300 focus:ring-orange-200 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
            aria-label="Search menu items"
            disabled={orderPlaced}
          />
          
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
                       flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 
                       transition-all duration-200"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Indicator */}
        {searchTerm && (
          <div className="mt-2 flex items-center gap-2 text-sm bg-orange-50 rounded-lg px-3 py-2">
            <span className="text-gray-600">Searching:</span>
            <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-medium">
              "{searchTerm}"
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-500 hover:text-red-600 ml-auto"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

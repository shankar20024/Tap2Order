"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function MenuSearch({ 
  searchTerm, 
  setSearchTerm, 
  categories, 
  activeCategory, 
  setActiveCategory,
  orderPlaced 
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-200 shadow-md backdrop-blur-sm">
      <div className="px-4 py-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 rounded-xl pointer-events-none"></div>
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <input
            type="search"
            placeholder="Search delicious menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`relative w-full pl-12 pr-12 py-4 text-sm border rounded-xl bg-white/80 backdrop-blur-sm
                     focus:outline-none focus:ring-2 focus:border-transparent shadow-md hover:shadow-lg
                     transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     ${isSearchFocused ? 'border-amber-300 focus:ring-amber-200 shadow-xl transform scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}`}
            aria-label="Search menu items"
            disabled={orderPlaced}
          />
          
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-7 h-7 
                       flex items-center justify-center rounded-full bg-gray-100/80 hover:bg-red-100 
                       transition-all duration-200 hover:scale-110 shadow-sm z-10"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="relative">
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            <div className="flex space-x-2">
              {/* All Categories Button */}
              <button
                onClick={() => setActiveCategory('All')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 
                         min-h-[40px] flex items-center justify-center whitespace-nowrap border shadow-sm hover:shadow-md ${
                  activeCategory === 'All'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-lg shadow-amber-500/25'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:border-amber-300'
                }`}
                aria-current={activeCategory === 'All' ? 'true' : undefined}
                disabled={orderPlaced}
              >
                🍽️ All
              </button>

              {/* Category Buttons */}
              {categories.map(category => {
                const categoryEmojis = {
                  'appetizers': '🥗',
                  'main-course': '🍛',
                  'desserts': '🍰',
                  'beverages': '🥤',
                  'snacks': '🍿',
                  'pizza': '🍕',
                  'burgers': '🍔',
                  'chinese': '🥢',
                  'indian': '🍛',
                  'italian': '🍝',
                  'veg': '🥗',
                  'non-veg': '🍗',
                  'jain': '🟠',
                  'none': '⚪'
                };
                
                // Shorten category names for mobile
                const displayName = category === 'main-course' ? 'main' : 
                                 category === 'non-veg' ? 'non-veg' : 
                                 category === 'appetizers' ? 'starters' : category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 
                             min-h-[40px] flex items-center justify-center whitespace-nowrap border shadow-sm hover:shadow-md ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-lg shadow-amber-500/25'
                        : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:border-amber-300'
                    }`}
                    aria-current={activeCategory === category ? 'true' : undefined}
                    disabled={orderPlaced}
                  >
                    {categoryEmojis[category] || '🍴'} {displayName}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Gradient fade effect on the right side - only show when categories are few */}
          {categories.length <= 2 && (
            <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          )}
        </div>

        {/* Active Filter Indicator */}
        {(searchTerm || activeCategory !== 'All') && (
          <div className="flex items-center gap-3 text-sm bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/50 shadow-md">
            <span className="text-gray-700 font-semibold">🔍 Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                "{searchTerm}"
              </span>
            )}
            {activeCategory !== 'All' && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                {activeCategory.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('All');
              }}
              className="text-xs text-gray-500 hover:text-red-600 underline font-semibold ml-2 transition-colors duration-200"
            >
              ✕ Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

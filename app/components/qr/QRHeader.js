"use client";

import { useEffect } from "react";
import Logo from "@/app/components/Logo";

export default function QRHeader({ username, tableNumber, apiStatus, hotelName }) {
  // Debug: Log props when they change
  useEffect(() => {
    console.log('QRHeader props:', { username, tableNumber, apiStatus, hotelName });
  }, [username, tableNumber, apiStatus, hotelName]);

  return (
    <header className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 shadow-lg backdrop-blur-sm">
      <div className="px-4 py-4">
        {/* Top Row - Logo & Restaurant */}
        <div className="flex items-center justify-between mb-2 sm:mb-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-md border border-gray-200/50">
                <Logo className="text-2xl text-gray-800" />
              </div>
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-600 rounded-full shadow-sm"></div>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 truncate max-w-[200px]">
                {hotelName || username || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Restaurant
              </p>
            </div>
          </div>
          
          {/* Status Indicator - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50 shadow-sm">
            <div className={`w-3 h-3 rounded-full shadow-lg ${apiStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                 title={apiStatus ? 'Connected' : 'Disconnected'}>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {apiStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Bottom Row - Table Status (Mobile) and Status Indicator */}
        <div className="flex items-center justify-between mt-2 sm:hidden">
          <div className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-md">
            <span className="text-sm font-bold text-gray-700 tracking-wide">
              TABLE {tableNumber}
            </span>
          </div>
          
          {/* Status Indicator - Mobile */}
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50 shadow-sm">
            <div className={`w-3 h-3 rounded-full shadow-lg ${apiStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                 title={apiStatus ? 'Connected' : 'Disconnected'}>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {apiStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Table Status - Desktop */}
        <div className="hidden sm:flex items-center justify-end mt-3">
          <div className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <span className="text-sm font-bold text-gray-700 tracking-wide">
              TABLE {tableNumber}
            </span>
          </div>
        </div>
      </div>
      
      {/* Modern accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 opacity-60"></div>
    </header>
  );
}

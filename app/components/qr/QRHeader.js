"use client";

import { useEffect } from "react";
import Logo from "@/app/components/Logo";

export default function QRHeader({ username, tableNumber, apiStatus, hotelName, customerInfo }) {
  return (
    <header className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 shadow-lg backdrop-blur-sm">
      <div className="px-4 py-4">
        {/* Top Row - Logo & Restaurant */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-md border border-gray-200/50">
                <Logo className="text-2xl text-amber-800" />
              </div>
              <div className="w-1 h-8 bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 rounded-full shadow-sm"></div>
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
          
          {/* Status Indicator - Desktop */}
          <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50 shadow-sm">
            <div className={`w-3 h-3 rounded-full shadow-lg ${apiStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                 title={apiStatus ? 'Connected' : 'Disconnected'}>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {apiStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Welcome Message Row - Full Width */}
        {customerInfo && (
          <div className="mb-3">
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="text-amber-600 text-lg">👋</span>
                <p className="text-sm text-amber-800 font-medium text-center">
                  Welcome, <span className="font-semibold text-amber-900">{customerInfo.name}</span>! Ready to order?
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Row - Table & Status */}
        <div className="flex items-center justify-between">
          <div className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <span className="text-sm font-bold text-gray-700 tracking-wide">
              TABLE {tableNumber}
            </span>
          </div>
          
          {/* Status Indicator - Mobile */}
          <div className="flex sm:hidden items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50 shadow-sm">
            <div className={`w-3 h-3 rounded-full shadow-lg ${apiStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                 title={apiStatus ? 'Connected' : 'Disconnected'}>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {apiStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Modern accent line */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-60"></div>
    </header>
  );
}

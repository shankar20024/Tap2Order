"use client";

import {
  FaSync,
  FaHistory,
  FaChair,
  FaChartLine,
  FaConciergeBell,
  FaTachometerAlt,
} from "react-icons/fa";

// Enhanced Quick Actions with Stunning Effects
const QuickActions = ({
  onRefresh,
  onViewHistory,
  onManageTables,
  onViewAnalytics,
  onViewWaiter,
  className = "",
}) => (
  <div
    className={`bg-white rounded-3xl shadow-2xl border-0 overflow-hidden ${className} backdrop-blur-lg scale-90`}
  >
    <div className="bg-gradient-to-r from-slate-800 via-gray-900 to-black px-4 sm:px-6 py-4 border-b-0">
      <h3 className="text-lg sm:text-xl font-black text-white flex items-center">
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-3 shadow-lg animate-pulse">
          <FaTachometerAlt className="text-white text-base sm:text-lg" />
        </div>
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Quick Actions
        </span>
      </h3>
    </div>

    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={onRefresh}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-blue-500 to-cyan-600 text-white
                   shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 
                   transform hover:-translate-y-1 hover:scale-105"
        >
          <FaSync className="text-2xl sm:text-3xl mb-2 group-hover:animate-spin" />
          <span className="text-xs sm:text-sm font-bold">Refresh</span>
        </button>
        <button
          onClick={onViewHistory}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-purple-500 to-indigo-600 text-white
                   shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 
                   transform hover:-translate-y-1 hover:scale-105"
        >
          <FaHistory className="text-2xl sm:text-3xl mb-2 group-hover:rotate-[-45deg] transition-transform" />
          <span className="text-xs sm:text-sm font-bold">History</span>
        </button>
        <button
          onClick={onManageTables}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-green-500 to-teal-600 text-white
                   shadow-lg hover:shadow-teal-500/50 transition-all duration-300 
                   transform hover:-translate-y-1 hover:scale-105"
        >
          <FaChair className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-bold">Tables</span>
        </button>
        <button
          onClick={onViewAnalytics}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-orange-500 to-red-600 text-white
                   shadow-lg hover:shadow-red-500/50 transition-all duration-300 
                   transform hover:-translate-y-1 hover:scale-105"
        >
          <FaChartLine className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-bold">Analytics</span>
        </button>
        <button
          onClick={onViewWaiter}
          className="group flex flex-col items-center p-4 sm:p-5 rounded-2xl border-0 
                   bg-gradient-to-br from-pink-500 to-rose-600 text-white
                   shadow-lg hover:shadow-rose-500/50 transition-all duration-300 
                   transform hover:-translate-y-1 hover:scale-105 col-span-2 lg:col-span-1"
        >
          <FaConciergeBell className="text-2xl sm:text-3xl mb-2 group-hover:animate-shake" />
          <span className="text-xs sm:text-sm font-bold">Waiter View</span>
        </button>
      </div>
    </div>
  </div>
);

export default QuickActions;

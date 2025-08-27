'use client';

import { FaChartLine, FaRocket, FaClock } from 'react-icons/fa';

export default function ComingSoon({ feature = "Analytics" }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/20">
          {/* Icon */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-6 shadow-xl">
                <FaChartLine className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full p-2 animate-pulse">
                <FaRocket className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {feature} Coming Soon!
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-6 font-medium">
            We're working hard to bring you amazing insights
          </p>

          {/* Description */}
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            Our advanced analytics dashboard is currently under development. 
            Soon you'll be able to track your restaurant's performance with 
            detailed reports, revenue insights, and customer analytics.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="text-blue-500 text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Revenue Tracking</h3>
              <p className="text-sm text-gray-600">Real-time revenue analytics and trends</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="text-green-500 text-2xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-800 mb-2">Performance Metrics</h3>
              <p className="text-sm text-gray-600">Order completion rates and efficiency</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="text-purple-500 text-2xl mb-3">👥</div>
              <h3 className="font-semibold text-gray-800 mb-2">Customer Insights</h3>
              <p className="text-sm text-gray-600">Customer behavior and preferences</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <FaClock className="text-orange-500 w-5 h-5" />
              <span className="text-orange-700 font-semibold">Currently in Development</span>
            </div>
            <p className="text-orange-600 text-sm mt-2">
              Expected launch: Coming Soon
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <p className="text-gray-600 font-medium">
              Stay tuned for updates!
            </p>
            <button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              Go Back to Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Thank you for your patience as we build something amazing! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

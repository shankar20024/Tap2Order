'use client';

import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 bg-red-500 rounded-full"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-orange-500 rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-500 rounded-full"></div>
            <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-red-400 rounded-full"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto relative z-10"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <FaExclamationTriangle className="text-white text-5xl" />
                </div>
                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-8 h-8 bg-red-300 rounded-full opacity-70"
                ></motion.div>
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute -bottom-2 -left-6 w-6 h-6 bg-orange-300 rounded-full opacity-60"
                ></motion.div>
              </div>
            </motion.div>

            {/* Error Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent mb-4">
                Error!
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Application Error
              </h2>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                A critical error occurred in the Tap2Order application. 
                Please try refreshing the page or contact support if the problem persists.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
                <span className="text-sm font-medium">Tap2Order - Restaurant Management System</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => reset()}
                className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
              >
                <FaRedo className="text-lg" />
                Try Again
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-3 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-red-300 min-w-[200px]"
              >
                <FaHome className="text-lg" />
                Go to Home
              </motion.button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-red-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What happened?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• A critical application error occurred</p>
                <p>• The error has been logged for investigation</p>
                <p>• Try refreshing the page</p>
                <p>• Contact support if the issue continues</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}

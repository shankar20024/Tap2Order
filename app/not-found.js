'use client';

import { motion } from 'framer-motion';
import { FaHome, FaUtensils, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function NotFound() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGoHome = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-500 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-red-500 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-pink-500 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-orange-400 rounded-full"></div>
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
            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <FaExclamationTriangle className="text-white text-5xl" />
            </div>
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-4 -right-4 w-8 h-8 bg-orange-300 rounded-full opacity-70"
            ></motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -bottom-2 -left-6 w-6 h-6 bg-red-300 rounded-full opacity-60"
            ></motion.div>
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Page Not Found
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
            Oops! The page you're looking for seems to have wandered off the menu. 
            It might have been moved, deleted, or you may have entered the wrong URL.
          </p>
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <FaUtensils className="text-xl" />
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
            onClick={handleGoHome}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
          >
            <FaHome className="text-lg" />
            {session ? 'Go to Dashboard' : 'Go to Home'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoBack}
            className="flex items-center gap-3 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 min-w-[200px]"
          >
            <FaArrowLeft className="text-lg" />
            Go Back
          </motion.button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-orange-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Need Help?</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Check if the URL is spelled correctly</p>
            <p>• Try refreshing the page</p>
            <p>• Go back to the previous page and try again</p>
            <p>• Contact support if the problem persists</p>
          </div>
        </motion.div>

        {/* Animated Food Icons */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-0 text-orange-200 text-2xl opacity-30"
          >
            🍕
          </motion.div>
          <motion.div
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              rotate: [0, -180, -360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 right-0 text-red-200 text-3xl opacity-30"
          >
            🍔
          </motion.div>
          <motion.div
            animate={{ 
              x: [0, 120, 0],
              y: [0, -80, 0],
              rotate: [0, 270, 540]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 left-1/4 text-orange-200 text-2xl opacity-30"
          >
            🍜
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

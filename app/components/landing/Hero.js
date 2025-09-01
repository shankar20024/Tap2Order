'use client';

import { motion } from 'framer-motion';
import { FaQrcode, FaUtensils, FaMobile, FaChartLine } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

export default function Hero() {
  const floatingIcons = [
    { icon: FaQrcode, delay: 0, x: 100, y: 50 },
    { icon: FaUtensils, delay: 0.5, x: -80, y: 80 },
    { icon: FaMobile, delay: 1, x: 120, y: -60 },
    { icon: FaChartLine, delay: 1.5, x: -100, y: -40 },
  ];

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-16 sm:pt-20 md:pt-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-10 left-4 sm:top-20 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-amber-300/30 to-orange-400/30 rounded-full blur-2xl sm:blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-orange-300/30 to-red-400/30 rounded-full blur-2xl sm:blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating Icons - Hidden on mobile for better performance */}
        <div className="hidden sm:block">
          {floatingIcons.map((item, index) => (
            <motion.div
              key={index}
              className="absolute text-amber-400/20"
              style={{
                left: `${50 + item.x}%`,
                top: `${50 + item.y}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 6 + index,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut"
              }}
            >
              <item.icon size={40} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-amber-200 mb-4 sm:mb-6 mt-3 mx-10 "
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <HiSparkles className="text-amber-500" />
            <span className="text-amber-700 font-medium text-sm sm:text-base">Revolutionary Restaurant Management</span>
          </motion.div>
          
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Tap2Orders
          </motion.h1>
          
          <motion.div
            className="text-base sm:text-lg md:text-xl font-semibold text-amber-700 mt-2 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            "Order Smart, Serve Faster, Grow Better"
          </motion.div>
          
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-700 mt-4 sm:mt-6 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Transform your restaurant with QR-based ordering, real-time management, 
            and seamless customer experience. The future of dining is here.
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.button
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px] sm:min-w-[250px]"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
          >
            🚀 Start Free Trial
          </motion.button>
          
          <motion.button
            className="w-full sm:w-auto border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl transition-all duration-300 min-w-[200px] sm:min-w-[250px]"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            📺 Watch Demo
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { number: "500+", label: "Restaurants" },
            { number: "50K+", label: "Orders Daily" },
            { number: "99.9%", label: "Uptime" },
            { number: "24/7", label: "Support" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600 mb-2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-600 font-medium text-sm sm:text-base">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-amber-400 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-2 sm:h-3 bg-amber-400 rounded-full mt-1 sm:mt-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

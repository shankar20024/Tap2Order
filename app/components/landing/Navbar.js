'use client';

import { motion } from 'framer-motion';
import Logo from '../Logo';

export default function Navbar() {
  return (
    <motion.nav
      className="fixed w-full top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col">
              <Logo className="text-2xl" />
              <span className="text-xs text-amber-600 font-medium -mt-1">Smart Restaurant Solutions</span>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <a href="#features" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
              How It Works
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
              Reviews
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
              Pricing
            </a>
          </div>

          {/* Login Button */}
          <motion.button
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
          >
            <span className="hidden sm:inline">Login / Sign Up</span>
            <span className="sm:hidden">Login</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

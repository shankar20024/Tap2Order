'use client';

import { motion } from 'framer-motion';
import Logo from '../Logo';

export default function Navbar() {
  return (
    <motion.nav
      className="fixed max-w-[100%] top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center  md:justify-between gap-20 ">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col">
              <Logo className="text-3xl" />
              <span className="text-xs text-amber-600 font-medium -mt-1">Smart Restaurant Solutions</span>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
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
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
          >
            Login / Sign Up
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import Logo from '../Logo';

export default function Navbar({ onContactClick }) {
  const navItems = ['Features', 'How it Works', 'Testimonials', 'Pricing', 'Contact'];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        {/* Logo */}
        <motion.div
          className="flex-shrink-0"
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <a href="#" className="flex flex-col items-center gap-2">
              <Logo className="text-3xl" />
                <span className="text-xs text-amber-600 font-medium -mt-1">Smart Restaurant Solutions</span>
          </a>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={item === 'Contact' ? '#' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={item === 'Contact' ? (e) => { e.preventDefault(); onContactClick(); } : undefined}
                className="text-gray-600 hover:text-amber-700 transition-colors duration-300 font-medium relative group cursor-pointer"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
              </a>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/login'}
          >
            <span>Login</span>
            <FaArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

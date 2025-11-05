'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import Logo from '../Logo';

export default function Navbar({ onContactClick }) {
  const navItems = ['Features', 'How it Works', 'Testimonials', 'Pricing', 'Contact'];
  const [isTop, setIsTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsTop(window.scrollY < 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-6xl transition-all duration-500"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Navbar container with dynamic background */}
      <div
        className={`relative border border-white/30 rounded-2xl shadow-2xl shadow-gray-900/10 
          ${isTop
            ? 'bg-gradient-to-r from-orange-100 via-white to-gray-200'
            : 'bg-white/25 backdrop-blur-3xl'
          }`}
      >
        <div className="px-6 sm:px-8 flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <a href="#" className="flex items-center gap-2">
              <img src="/T2O.png" alt="Tap2Order" className="h-8 w-auto" />
              <Logo className="text-2xl" />
            </a>
          </motion.div>

          {/* Nav items */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <motion.a
                  key={item}
                  href={item === 'Contact' ? '#' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={item === 'Contact' ? (e) => { e.preventDefault(); onContactClick(); } : undefined}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white/50 transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>

            {/* Login button */}
            <motion.button
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.href = '/login'}
            >
              <span>Login</span>
              <FaArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

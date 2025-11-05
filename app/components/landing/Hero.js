'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';

export default function Hero({ onGetStartedClick }) {
  return (
    <section id="hero" className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 via-white to-white overflow-hidden pt-32 sm:pt-28">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/30 via-orange-50/20 to-transparent rounded-full filter blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-orange-100/30 via-amber-50/20 to-transparent rounded-full filter blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Text Content - Minimal & Luxurious */}
          <motion.div
            className="text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Overline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100/80 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></span>
                Smart Restaurant Solutions
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Revolutionize
              <span className="block mt-2">Your Restaurant</span>
              <span className="block mt-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                Experience
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-light">
              The all-in-one platform for QR ordering, real-time kitchen sync, and powerful analytics. Designed for modern restaurants.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start justify-center lg:justify-start pt-2">
              <motion.button
                className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGetStartedClick}
              >
                <span>Get Started Free</span>
                <FaArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
              
              <motion.button
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base font-medium px-6 py-4 rounded-2xl hover:bg-gray-100/80 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Watch Demo</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.button>
            </div>

            {/* Social Proof */}
            {/* <motion.div
              className="flex items-center gap-8 pt-4 justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">500+ Restaurants</p>
                <p className="text-xs text-gray-600">Trust tap2orders</p>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Mockups - Clean & Modern */}
          <motion.div
            className="relative h-[500px] sm:h-[600px] lg:h-[700px] flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Desktop Mockup */}
            <motion.div
              className="relative z-10 w-full max-w-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 bg-white ring-1 ring-gray-900/5">
                <div className="w-full aspect-video relative">
                  <Image
                    src="/Dashboard.png"
                    alt="tap2orders Dashboard"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    className="object-contain"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* Mobile Mockup */}
            <motion.div
              className="absolute z-20 -bottom-8 -right-4 sm:-right-8 lg:-right-12 w-40 sm:w-48 lg:w-56"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-900/20 bg-white ring-1 ring-gray-900/10">
                <div className="w-full aspect-[9/19] relative">
                  <Image
                    src="/QR-Page.png"
                    alt="tap2orders Mobile"
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-contain"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

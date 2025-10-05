'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';
import DashboardScreenshot from '../../../public/Web-Screenshot/Dashboard.png';

export default function Hero({ onGetStartedClick }) {
  return (
    <section id="hero" className="relative w-full min-h-screen flex items-center justify-center bg-white overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 bg-amber-100/50 rounded-full filter blur-3xl opacity-70"
          animate={{ x: [0, 50, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-orange-100/50 rounded-full filter blur-3xl opacity-70"
          animate={{ x: [0, -50, 0], y: [0, -25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 5 }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Revolutionize Your Restaurant with
              <span className="block bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-1">
                Tap2Order
              </span>
            </h1>
            <p className="mt-4 text-md md:text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
              The all-in-one solution for QR code ordering, real-time kitchen management, and insightful analytics. Boost efficiency and delight your customers.
            </p>
            <motion.button
              className="mt-8 inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-md shadow-lg hover:shadow-xl hover:bg-gray-800 transition-all duration-300 transform hover:-translate-y-0.5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStartedClick}
            >
              <span>Get Started Free</span>
              <FaArrowRight />
            </motion.button>
          </motion.div>

          {/* Mockups */}
          <motion.div
            className="relative h-64 lg:h-auto flex justify-center items-center mt-8 lg:mt-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            {/* Desktop Mockup */}
            <motion.div
              className="relative z-10 w-full max-w-lg shadow-2xl rounded-lg bg-white p-1.5"
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-full aspect-video relative rounded-sm overflow-hidden">
                <Image
                  src={DashboardScreenshot}
                  alt="Tap2Order Dashboard View"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  className="rounded-sm object-contain"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </motion.div>


            {/* Mobile Mockup */}
            <motion.div
              className="absolute z-20 -bottom-20 -right-2 sm:-right-8 md:-right-12 lg:-right-12 w-30 sm:w-38 md:w-44 lg:w-40 shadow-2xl rounded-xl bg-white p-1 border-2 border-gray-800"
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-full h-auto aspect-[9/16] relative rounded-md overflow-hidden">
                <Image
                  src="/Web-Screenshot/QR-Page.png"
                  alt="Tap2Order Mobile View"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 40vw"
                  className="rounded-md object-cover object-center"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  priority
                />
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

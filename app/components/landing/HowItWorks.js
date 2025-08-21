'use client';

import { motion } from 'framer-motion';
import { FaQrcode, FaUtensils, FaCreditCard, FaCheck } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

export default function HowItWorks() {
  const steps = [
    {
      icon: FaQrcode,
      title: "Scan QR Code",
      description: "Customer scans the QR code on their table to access the digital menu instantly",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      step: "01"
    },
    {
      icon: FaUtensils,
      title: "Browse & Order",
      description: "Browse the interactive menu, customize items, and place orders directly from their phone",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      step: "02"
    },
    {
      icon: FaCreditCard,
      title: "Pay & Enjoy",
      description: "Secure payment processing and real-time order tracking until food arrives",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      step: "03"
    },
    {
      icon: FaCheck,
      title: "Seamless Service",
      description: "Kitchen receives orders instantly, staff manages efficiently, customers enjoy faster service",
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      step: "04"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 rounded-full border border-amber-200 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <FaUtensils className="text-amber-500" />
            <span className="text-amber-700 font-medium">Simple Process</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            How Tap2Orders Works
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your restaurant operations in 4 simple steps. No app downloads required, 
            no complicated setup - just scan and order!
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Step Card */}
                <motion.div
                  className={`relative bg-gradient-to-br ${step.bgColor} p-8 rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden`}
                  whileHover={{ 
                    scale: 1.05,
                    y: -10
                  }}
                >
                  {/* Step Number */}
                  <div className="absolute top-4 right-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {step.step}
                    </div>
                  </div>

                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent transform rotate-12 translate-x-1/4"></div>
                  </div>

                  {/* Icon */}
                  <motion.div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl mb-6 shadow-xl`}
                    whileHover={{ 
                      rotate: 360,
                      scale: 1.1
                    }}
                    transition={{ duration: 0.6 }}
                  >
                    <step.icon className="text-3xl text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {step.description}
                  </p>

                  {/* Hover Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Arrow (Desktop only) */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  >
                    <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-amber-200">
                      <HiArrowRight className="text-amber-500 text-lg" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Transform Your Restaurant?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of restaurants already using Tap2Orders to increase efficiency, 
              reduce wait times, and boost customer satisfaction.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/login'}
              >
                🚀 Get Started Free
              </motion.button>
              
              <motion.button
                className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

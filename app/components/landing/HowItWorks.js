'use client';

import { motion } from 'framer-motion';
import { FaQrcode, FaPaperPlane, FaUtensils } from 'react-icons/fa';

const steps = [
  {
    icon: FaQrcode,
    title: "Scan & Browse",
    description: "Customers scan a QR code at their table to instantly access your beautiful, interactive digital menu.",
  },
  {
    icon: FaPaperPlane,
    title: "Order & Pay",
    description: "They place their order and pay securely from their own device, without waiting for a server.",
  },
  {
    icon: FaUtensils,
    title: "Serve & Delight",
    description: "The order is sent directly to your kitchen, ensuring faster service and happier customers.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-amber-600 mb-4 tracking-wide uppercase">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              Get Started in
              <span className="block mt-1">3 Simple Steps</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Transform your dining experience with a process that's as easy as it is efficient.
            </p>
          </motion.div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* The connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-orange-500/50 to-amber-500/50" aria-hidden="true"></div>

          <div className="space-y-24 lg:space-y-32">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12 lg:order-2'}`}>
                  <motion.div
                    className="inline-block"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl mb-6 shadow-lg shadow-amber-500/30">
                      <step.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-md inline-block">{step.description}</p>
                  </motion.div>
                </div>
                
                {/* Step number indicator */}
                <div className={`hidden lg:flex lg:w-1/2 items-center justify-center ${index % 2 === 0 ? 'lg:order-2' : ''}`}>
                  <motion.div 
                    className="absolute h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{index + 1}</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

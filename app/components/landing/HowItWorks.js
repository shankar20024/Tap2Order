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
    <section id="how-it-works" className="py-20 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Get Started in 3 Simple Steps
          </h2>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your dining experience with a process that's as easy as it is efficient.
          </p>
        </div>

        <div className="relative">
          {/* The connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative flex flex-col lg:flex-row items-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
              >
                <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-8 lg:text-right' : 'lg:pl-8 lg:order-2'}`}>
                  <div className="inline-block">
                    <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-lg">{step.description}</p>
                  </div>
                </div>
                
                <div className={`hidden lg:flex lg:w-1/2 items-center justify-center ${index % 2 === 0 ? 'lg:order-2' : ''}`}>
                  <div className="absolute h-8 w-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

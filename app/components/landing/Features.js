'use client';

import { motion } from 'framer-motion';
import { 
  FaQrcode, 
  FaMobileAlt, 
  FaChartPie, 
  FaCashRegister, 
  FaUsersCog, 
  FaShieldAlt 
} from 'react-icons/fa';

const features = [
  {
    icon: FaQrcode,
    title: "Seamless QR ordering",
    description: "Customers scan, browse, and order directly from their table. No apps, no fuss.",
  },
  {
    icon: FaMobileAlt,
    title: "Real-Time Kitchen Sync",
    description: "Orders appear instantly in the kitchen, reducing errors and speeding up service.",
  },
  {
    icon: FaChartPie,
    title: "Insightful Analytics",
    description: "Track sales, identify popular items, and make data-driven decisions to grow your business.",
  },
  {
    icon: FaCashRegister,
    title: "Effortless Billing",
    description: "Generate bills, split payments, and manage transactions with a simple, intuitive interface.",
  },
  {
    icon: FaUsersCog,
    title: "Staff Management",
    description: "Assign roles, manage permissions, and track performance for your entire team.",
  },
  {
    icon: FaShieldAlt,
    title: "Secure & reliable",
    description: "Built with enterprise-grade security to protect your data and ensure maximum uptime.",
  },
];

export default function Features() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
  };

  return (
    <section id="features" className="py-20 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            A Smarter Way to Manage Your Restaurant
          </h2>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Tap2Order is packed with powerful features designed to streamline your operations, enhance customer experience, and boost your bottom line.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              variants={itemVariants}
            >
              <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-6">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

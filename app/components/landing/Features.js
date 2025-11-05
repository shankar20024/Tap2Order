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
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    },
  };

  return (
    <section id="features" className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-amber-600 mb-4 tracking-wide uppercase">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              A Smarter Way to
              <span className="block mt-1">Manage Your Restaurant</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Powerful features designed to streamline operations and enhance customer experience.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-white p-8 rounded-3xl border border-gray-200/60 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              {/* Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 group-hover:shadow-xl group-hover:shadow-amber-500/30 transition-shadow duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover accent */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

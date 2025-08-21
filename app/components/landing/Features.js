'use client';

import { motion } from 'framer-motion';
import { 
  FaQrcode, 
  FaUtensils, 
  FaMobile, 
  FaChartLine, 
  FaClock, 
  FaUsers, 
  FaCreditCard, 
  FaBell,
  FaShieldAlt,
  FaCloud
} from 'react-icons/fa';

export default function Features() {
  const features = [
    {
      icon: FaQrcode,
      title: "QR Code Ordering",
      description: "Customers scan QR codes to access digital menus and place orders instantly without waiting for staff.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      icon: FaMobile,
      title: "Mobile-First Design",
      description: "Optimized for smartphones with intuitive touch interfaces and lightning-fast performance.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      icon: FaChartLine,
      title: "Real-Time Analytics",
      description: "Track sales, popular items, peak hours, and customer preferences with detailed insights.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      icon: FaClock,
      title: "Order Management",
      description: "Streamlined kitchen workflow with real-time order status updates and preparation tracking.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      icon: FaUsers,
      title: "Staff Dashboard",
      description: "Dedicated interfaces for waiters, chefs, and managers with role-based access control.",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50"
    },
    {
      icon: FaCreditCard,
      title: "Payment Integration",
      description: "Secure payment processing with multiple payment methods and automated billing.",
      gradient: "from-teal-500 to-green-500",
      bgGradient: "from-teal-50 to-green-50"
    },
    {
      icon: FaBell,
      title: "Live Notifications",
      description: "Instant alerts for new orders, status updates, and important restaurant events.",
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    },
    {
      icon: FaShieldAlt,
      title: "Multi-Tenant Security",
      description: "Enterprise-grade security with data isolation and role-based access for multiple restaurants.",
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-50 to-pink-50"
    },
    {
      icon: FaCloud,
      title: "Cloud-Based",
      description: "Access your restaurant data anywhere, anytime with automatic backups and 99.9% uptime.",
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-50 to-blue-50"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
            <span className="text-amber-700 font-medium">Powerful Features</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            Everything You Need to Run Your Restaurant
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tap2Orders provides a complete restaurant management solution with cutting-edge technology 
            and intuitive design that your staff and customers will love.
          </p>
        </motion.div>

        {/* Features Grid */}
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
              variants={itemVariants}
              className={`relative group bg-gradient-to-br ${feature.bgGradient} p-8 rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden`}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                rotateX: 5
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent transform rotate-45 translate-x-1/2"></div>
              </div>

              {/* Icon */}
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl mb-6 shadow-lg`}
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1
                }}
                transition={{ duration: 0.6 }}
              >
                <feature.icon className="text-2xl text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.button
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
          >
            🚀 Start Your Free Trial Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

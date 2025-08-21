'use client';

import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaCrown, FaRocket } from 'react-icons/fa';

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for small restaurants and cafes",
      icon: FaRocket,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      popular: false,
      features: [
        { text: "Up to 10 tables", included: true },
        { text: "QR code ordering", included: true },
        { text: "Basic menu management", included: true },
        { text: "Order management", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Staff accounts (2)", included: true },
        { text: "Multi-language support", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false }
      ]
    },
    {
      name: "Professional",
      price: "₹2,499",
      period: "/month",
      description: "Best for growing restaurants with multiple locations",
      icon: FaCrown,
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
      popular: true,
      features: [
        { text: "Up to 50 tables", included: true },
        { text: "QR code ordering", included: true },
        { text: "Advanced menu management", included: true },
        { text: "Order management", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority email & chat support", included: true },
        { text: "Unlimited staff accounts", included: true },
        { text: "Multi-language support", included: true },
        { text: "Custom branding", included: true },
        { text: "API access", included: false }
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large restaurant chains and franchises",
      icon: FaCrown,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      popular: false,
      features: [
        { text: "Unlimited tables", included: true },
        { text: "QR code ordering", included: true },
        { text: "Enterprise menu management", included: true },
        { text: "Advanced order management", included: true },
        { text: "Enterprise analytics", included: true },
        { text: "24/7 phone support", included: true },
        { text: "Unlimited staff accounts", included: true },
        { text: "Multi-language support", included: true },
        { text: "Full custom branding", included: true },
        { text: "Full API access", included: true }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
            <FaCrown className="text-amber-500" />
            <span className="text-amber-700 font-medium">Simple Pricing</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            Choose Your Perfect Plan
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Start with our free trial and scale as you grow. All plans include core features 
            with no setup fees or hidden costs.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative bg-gradient-to-br ${plan.bgColor} rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-visible group ${plan.popular ? 'ring-2 ring-amber-400 scale-105 mt-8' : ''}`}
              whileHover={{ 
                scale: plan.popular ? 1.08 : 1.05,
                y: -5
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <motion.div
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                >
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent transform rotate-12 translate-x-1/4"></div>
              </div>

              <div className="relative p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${plan.color} rounded-xl mb-4 shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <plan.icon className="text-2xl text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-lg">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + featureIndex * 0.05 }}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {feature.included ? (
                          <FaCheck size={12} />
                        ) : (
                          <FaTimes size={12} />
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl'
                      : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = '/login'}
                >
                  {plan.name === 'Enterprise' ? '📞 Contact Sales' : '🚀 Start Free Trial'}
                </motion.button>
              </div>

              {/* Hover Glow Effect */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${plan.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Questions About Pricing?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              All plans include a 14-day free trial, no setup fees, and you can cancel anytime. 
              Need a custom solution? Our enterprise team is here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/login'}
              >
                📞 Contact Sales
              </motion.button>
              
              <motion.button
                className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                View FAQ
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

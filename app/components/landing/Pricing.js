'use client';

import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaCrown, FaRocket } from 'react-icons/fa';

export default function Pricing({ onStartTrialClick, onContactSalesClick }) {
  const plans = [
    {
      name: "Starter",
      price: "₹299",
      period: "/month",
      description: "Perfect for small restaurants and cafes",
      icon: FaRocket,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      popular: false,
      features: [
        { text: "Up to 10 tables & Staff accounts (5)", included: true },
        { text: "QR code ordering", included: true },
        { text: "Menu & Order management", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Multi-language support", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false }
      ]
    },
    {
      name: "Professional",
      price: "₹499",
      period: "/month",
      description: "Best for growing restaurants with multiple locations",
      icon: FaCrown,
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
      popular: true,
      features: [
        { text: "Up to 50 tables", included: true },
        { text: "QR code ordering", included: true },
        { text: "Menu management", included: true },
        { text: "Order management", included: true },
        // { text: "Advanced analytics", included: true },
        { text: "Priority email & chat support", included: true },
        { text: "Staff accounts (10)", included: true },
        // { text: "Multi-language support", included: true },
        // { text: "Custom branding", included: true },
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
        { text: "Menu management", included: true },
        { text: "Order management", included: true },
        { text: "Analytics", included: true },
        { text: "24/7 phone support", included: true },
        { text: "Unlimited staff accounts", included: true },
        { text: "Multi-language support", included: true },
        // { text: "Full custom branding", included: true },
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
    <section id="pricing" className="py-24 sm:py-32 bg-white">
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
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              Choose Your
              <span className="block mt-1">Perfect Plan</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Start with our free trial and scale as you grow. No setup fees or hidden costs.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative bg-white rounded-3xl border transition-all duration-300 overflow-visible group ${plan.popular ? 'border-amber-500/50 shadow-xl shadow-amber-500/10' : 'border-gray-200/60 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5'}`}
              whileHover={{ y: -6 }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="relative p-8 lg:p-10">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-5 shadow-lg shadow-amber-500/20">
                    <plan.icon className="text-xl text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-base font-medium">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8 pt-6 border-t border-gray-100">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-center gap-3"
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
                      <span className={`text-sm leading-relaxed ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={plan.name === 'Enterprise' ? onContactSalesClick : onStartTrialClick}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </motion.button>
              </div>
              
              {/* Hover accent */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-gray-50 rounded-3xl p-10 lg:p-12 border border-gray-200/60">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
              All plans include a 14-day free trial with no setup fees. Need a custom solution? Our team is here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContactSalesClick}
              >
                Contact Sales
              </motion.button>
              
              <motion.button
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 px-6 py-4 rounded-2xl hover:bg-gray-100/80 font-medium transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

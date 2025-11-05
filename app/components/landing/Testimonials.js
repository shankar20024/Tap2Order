'use client';

import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

const testimonials = [
  {
    quote: 'Tap2Order has revolutionized our workflow. Orders are faster, mistakes are down, and our customers love the convenience. A must-have for any modern restaurant.',
    name: 'Aarav Patel',
    title: 'Owner, The Spice Route',
  },
  {
    quote: 'We saw a 20% increase in table turnover during peak hours. The analytics are a goldmine for understanding our business. Highly recommended!',
    name: 'Priya Sharma',
    title: 'Manager, Urban Bites',
  },
  {
    quote: 'The setup was a breeze, and the support team is fantastic. Our staff picked it up in no time, and it has made their jobs so much easier.',
    name: 'Rohan Mehta',
    title: 'GM, Coastal Grill',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-amber-600 mb-4 tracking-wide uppercase">
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              Loved by Restaurants
              <span className="block mt-1">Everywhere</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Don't just take our word for it. Here's what our partners have to say.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="group relative bg-white p-8 rounded-3xl border border-gray-200/60 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300 flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
            >
              {/* Quote mark decoration */}
              <div className="absolute top-6 right-6 text-6xl text-amber-500/10 font-serif leading-none">&ldquo;</div>
              
              <div className="flex-grow mb-6 relative z-10">
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed text-base">"{testimonial.quote}"</p>
              </div>

              {/* Author */}
              <div className="flex items-center pt-6 border-t border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-lg font-bold mr-4 shadow-lg shadow-amber-500/20">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 tracking-tight">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
                </div>
              </div>
              
              {/* Hover accent */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section id="testimonials" className="py-20 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Loved by restaurants Everywhere
          </h2>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our partners have to say about Tap2Order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            >
              <div className="flex-grow mb-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="h-5 w-5 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>

              {/* Letter Avatar */}
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold mr-4 border-2 border-amber-200 shadow-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

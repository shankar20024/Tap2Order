'use client';

import { useState } from 'react';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import HowItWorks from './components/landing/HowItWorks';
import Testimonials from './components/landing/Testimonials';
import Pricing from './components/landing/Pricing';
import Contact from './components/landing/Contact';
import Footer from './components/landing/Footer';
import ContactModal from './components/landing/ContactModal';

export default function LandingPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 overflow-x-hidden">
      <Navbar onContactClick={openContactModal} />
      <main>
        <Hero onGetStartedClick={openContactModal} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing onStartTrialClick={openContactModal} onContactSalesClick={openContactModal} />
        <Contact />
      </main>
      <Footer onContactClick={openContactModal} />
      
      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={closeContactModal} 
      />
    </div>
  );
}

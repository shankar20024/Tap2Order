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

export default function LandingPage() {
  const [showContact, setShowContact] = useState(false);

  const handleContactClick = () => {
    setShowContact(true);
    // Smooth scroll to contact section
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar onContactClick={handleContactClick} />
      <div className="min-h-screen w-full bg-white text-gray-900 overflow-x-hidden antialiased">
        <main>
          <Hero onGetStartedClick={handleContactClick} />
          <Features />
          <HowItWorks />
          <Testimonials />
          <Pricing 
            onStartTrialClick={handleContactClick} 
            onContactSalesClick={handleContactClick} 
          />
          <div id="contact">
            <Contact />
          </div>
        </main>
        <Footer onContactClick={handleContactClick} />
      </div>
    </>
  );
}

/**
 * Landing.tsx
 * 
 * The public-facing splash page for unauthenticated visitors.
 * Components:
 * - Hero: Brand introduction and primary CTA.
 * - About: Value proposition and mission.
 * - HowItWorks: Explanation of safe/anonymous support.
 * - Community: Social proof and statistics.
 * - Footer: Links and legal information.
 */

import React from 'react';
import Hero from '../components/Hero/Hero';
import About from '../components/About/About';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Community from '../components/Community/Community';
import Footer from '../components/Footer/Footer';

const Landing: React.FC = () => {
  return (
    <div className="landing">
      {/* Scrollable landing page sections */}
      <Hero />
      <About />
      <HowItWorks />
      <Community />
      <Footer />
    </div>
  );
};

export default Landing;

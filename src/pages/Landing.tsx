import React from 'react';
import Hero from '../components/Hero/Hero';
import About from '../components/About/About';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Community from '../components/Community/Community';
import Footer from '../components/Footer/Footer';

const Landing: React.FC = () => {
  return (
    <div className="landing">
      <Hero />
      <About />
      <HowItWorks />
      <Community />
      <Footer />
    </div>
  );
};

export default Landing;

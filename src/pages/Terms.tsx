import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer/Footer';

const Terms: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-hmo-dark text-slate-200">
      <div className="flex-grow pt-32">
        <div className="container mx-auto px-4 max-w-4xl pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-hmo-card border border-hmo-border p-8 sm:p-12 rounded-[2.5rem] shadow-2xl"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 border-b border-hmo-border pb-6">Terms of Service</h1>
            
            <div className="prose prose-invert max-w-none space-y-8 text-slate-400">
              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-accent">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using HearMeOut, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-accent">2. Community Safety</h2>
                <p>
                  HearMeOut is a supportive community. We strictly prohibit harassment, hate speech, bullying, or any form of abuse. Users found violating these standards will be subject to immediate account termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-accent">3. Content Ownership</h2>
                <p>
                  You retain all rights to the content you post on HearMeOut. However, by posting, you grant us a non-exclusive, royalty-free license to display and distribute your content within the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-accent">4. User Responsibility</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your password or allow anyone else to access your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-accent">5. Disclaimers</h2>
                <p>
                  HearMeOut is not a substitute for professional mental health advice or treatment. If you are in crisis, please seek professional help or contact an emergency hotline immediately.
                </p>
              </section>

              <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <p className="text-sm italic">
                  Effective Date: February 2026. For legal inquiries, please contact legal@hearmeout.com.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;

import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer/Footer';

const Privacy: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-hmo-dark hmo-text-primary transition-colors duration-300">
      <div className="flex-grow pt-32">
        <div className="container mx-auto px-4 max-w-4xl pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hmo-card p-8 sm:p-12 shadow-2xl dark:shadow-none"
          >
            <h1 className="text-3xl sm:text-4xl font-bold hmo-text-primary mb-8 border-b border-hmo-border pb-6">Privacy Policy</h1>
            
            <div className="prose prose-invert max-w-none space-y-8 hmo-text-secondary">
              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-primary">1. Our Commitment</h2>
                <p>
                  HearMeOut is built on the principle of absolute privacy. We understand the sensitivity of the thoughts and emotions shared on our platform, and our primary mission is to protect your identity.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-primary">2. Data Anonymization</h2>
                <p>
                  We do not track your real identity. While we require an email for account verification and security purposes, your public presence on HearMeOut is limited to your chosen username. We employ advanced hashing and encryption to ensure your shared content remains private.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-primary">3. Information Collection</h2>
                <p>
                  We collect minimal information required to operate the platform:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address for authentication and account recovery.</li>
                  <li>Username for community interaction.</li>
                  <li>Encrypted content that you choose to share.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-primary">4. Data Sharing</h2>
                <p>
                  We never sell, rent, or trade your personal information with third parties. Your data is only used to provide and improve the HearMeOut experience.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-primary">5. Security</h2>
                <p>
                  We implement industry-standard security measures to protect against unauthorized access, alteration, or destruction of data. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-hmo-border">
                <p className="text-sm italic hmo-text-secondary">
                  Last Updated: February 2026. For questions regarding this policy, please contact our privacy team at privacy@hearmeout.com.
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

export default Privacy;

import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer/Footer';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-hmo-dark pt-32 text-slate-200">
      <div className="container mx-auto px-4 max-w-4xl pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border p-8 sm:p-12 rounded-[2.5rem] shadow-2xl"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 border-b border-hmo-border pb-6">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-8 text-slate-400">
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

            <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <p className="text-sm italic">
                Last Updated: February 2026. For questions regarding this policy, please contact our privacy team at privacy@hearmeout.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;

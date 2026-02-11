import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Community.css';

const Community: React.FC = () => {
  const tags = ["Students", "Young Adults", "Introverts", "Creative Souls", "Anyone who needs a friend"];

  return (
    <section id="community" className="py-20 sm:py-32 bg-hmo-dark overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="bg-white/[0.02] border border-hmo-border rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center mb-16 sm:mb-24 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight">You Are Not Alone</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              Whether you're a student feeling overwhelmed, a young adult 
              navigating life's uncertainties, or just someone who feels a bit 
              misunderstood—HearMeOut is for you.
            </p>
            <p className="text-lg font-medium text-slate-300 mb-8 sm:mb-10">
              We're building a generation that values <span className="text-primary">empathy over exposure.</span>
            </p>
            
            <div className="flex flex-wrap gap-3 mt-8 sm:mt-10">
              {tags.map((tag, index) => (
                <span key={index} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1632653859951-7d52ea5498ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvdW5nJTIwcGVyc29uJTIwdGhpbmtpbmclMjBjYWxtJTIwbWluaW1hbGlzdGljfGVufDF8fHx8MTc3MDY3MjM1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                alt="Person in nature" 
                className="w-full aspect-[1.4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hmo-dark/60 via-transparent to-transparent"></div>
            </div>
          </div>
        </motion.div>

        <div className="text-center">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-10"
          >
            Ready to find your safe space?
          </motion.h3>
          <Link 
            to="/signup"
            className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-4 sm:px-12 sm:py-5 rounded-full text-base sm:text-lg font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
          >
            Join the Community Today
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Community;

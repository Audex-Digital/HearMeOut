import React from 'react';
import { MessageSquare, Heart, Sun, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <MessageSquare size={24} />,
      title: "Vent Safely",
      description: "Got something heavy on your chest? Let it out here. No one knows who you are, so you can be completely honest.",
      color: "#ff2d55"
    },
    {
      icon: <Heart size={24} />,
      title: "Feel Understood",
      description: "Connect with others who are going through similar struggles. Receive support without the judgment.",
      color: "#ff2d8d"
    },
    {
      icon: <Sun size={24} />,
      title: "No Drama Zone",
      description: "We have zero tolerance for bullying. Our community is curated for positivity and constructive support.",
      color: "#ff9500"
    },
    {
      icon: <UserX size={24} />,
      title: "Zero Trace",
      description: "Your posts aren't tied to your real life identity. What you say here, stays here.",
      color: "#5856d6"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-32 bg-hmo-dark overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <motion.span 
            className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            HOW IT WORKS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8"
          >
            Simple, Safe, and Supportive
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-400 leading-relaxed"
          >
            We've stripped away the complexity of modern social networks to bring you back to what matters: human connection.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="bg-white/[0.02] border border-hmo-border p-8 rounded-3xl hover:bg-white/[0.04] transition-all hover:translate-y-[-5px] group flex flex-col items-center sm:items-start text-center sm:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform" 
                style={{ backgroundColor: step.color }}
              >
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base mb-2">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

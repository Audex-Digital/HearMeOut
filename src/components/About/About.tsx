import React from 'react';
import { EyeOff, ShieldCheck, Cloud, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import './About.css';

const About: React.FC = () => {
  const features = [
    {
      icon: <EyeOff size={24} />,
      title: "Total Anonymity",
      description: "No real names, no profile pictures, no public identity. Share your story without the pressure of it being attached to \"you\"."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Safe & Private",
      description: "We prioritize your privacy above all else. Your data is protected, and our community guidelines ensure a toxicity-free zone."
    },
    {
      icon: <Cloud size={24} />,
      title: "No Pressure",
      description: "Forget about likes and follower counts. This isn't a popularity contest. It's a space for release, reflection, and support."
    }
  ];

  return (
    <section id="about" className="py-20 sm:py-32 bg-hmo-dark overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold hmo-text-primary mb-6 sm:mb-8"
          >
            Why We Built HearMeOut
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl hmo-text-secondary leading-relaxed"
          >
            In a world obsessed with likes, followers, and curated perfection, we wanted to create a sanctuary. A place where you can just be <strong className="hmo-text-primary">you</strong>—messy, real, and unfiltered.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
               className="hmo-card p-8 sm:p-10 hover:bg-slate-100 dark:hover:bg-white/[0.04] shadow-sm dark:shadow-none"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
               <h3 className="text-xl font-bold hmo-text-primary mb-4">{feature.title}</h3>
               <p className="hmo-text-secondary leading-relaxed text-sm sm:text-base">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-800/40 dark:to-slate-900/40 border border-hmo-border rounded-[2rem] sm:rounded-[3rem] overflow-hidden grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-8 sm:p-12 md:p-16">
             <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold hmo-text-primary mb-8 sm:mb-10">Different from the rest</h3>
             <ul className="flex flex-col gap-6 sm:gap-8">
               <li className="flex items-start gap-4 text-sm sm:text-base hmo-text-secondary">
                 <X size={20} className="text-red-500 shrink-0 mt-1" />
                 <span><strong className="hmo-text-primary">Traditional Social Media:</strong> Focuses on image, status, and validation.</span>
               </li>
               <li className="flex items-start gap-4 text-sm sm:text-base hmo-text-secondary">
                 <X size={20} className="text-red-500 shrink-0 mt-1" />
                 <span><strong className="hmo-text-primary">Traditional Social Media:</strong> Often leads to anxiety and comparison.</span>
               </li>
               <li className="flex items-start gap-4 text-sm sm:text-base hmo-text-secondary">
                 <Check size={20} className="text-green-500 shrink-0 mt-1" />
                 <span><strong className="hmo-text-primary">HearMeOut:</strong> Focuses on feelings, authenticity, and relief.</span>
               </li>
               <li className="flex items-start gap-4 text-sm sm:text-base hmo-text-secondary">
                 <Check size={20} className="text-green-500 shrink-0 mt-1" />
                 <span><strong className="hmo-text-primary">HearMeOut:</strong> Designed to reduce anxiety and foster connection.</span>
               </li>
            </ul>
          </div>
          <div className="bg-indigo-950/50 min-h-[300px] lg:min-h-full relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000')] bg-center bg-cover opacity-30"></div>
            <div className="relative text-5xl sm:text-7xl font-black text-white/10 rotate-[-10deg] text-center select-none pointer-events-none px-4">
              IS NOT A PLACE
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;

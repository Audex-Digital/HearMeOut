import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero: React.FC = () => {
  const avatars = [1, 2, 3]; // Placeholder for avatar images

  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden bg-hmo-dark min-h-screen flex items-center">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center text-center lg:text-left">
          <div className="hero-text">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-medium text-accent mb-6 sm:mb-8"
            >
              100% Anonymous & Safe
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-white mb-6 sm:mb-8 leading-[1.1]"
            >
              A Safe Space to <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">Speak Freely</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 sm:mb-12 leading-relaxed"
            >
              Express your true thoughts and emotions without fear of judgment. 
              HearMeOut is a private community designed for your peace of mind.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10 sm:mb-12"
            >
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-br from-primary to-violet-600 px-8 py-4 sm:px-10 sm:py-5 rounded-full text-base sm:text-lg font-bold text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:translate-y-[-2px]">
                Start Sharing <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 rounded-full text-base sm:text-lg font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Learn More
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 opacity-80"
            >
              <div className="flex -space-x-3">
                {avatars.map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-hmo-dark bg-slate-800" />
                ))}
              </div>
              <span className="text-sm text-slate-500 font-medium">Joined by 10,000+ others today</span>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[500px] aspect-square">
               {/* Main image placeholder */}
               <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&q=80&w=1000"
                    alt="Safe Space"
                    className="w-full h-full object-cover opacity-60"
                  />
               </div>
              
              {/* Floating Cards - Hidden on very small mobile for focus */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] -right-[5%] hidden sm:flex items-center gap-3 bg-hmo-card/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-20"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm font-semibold text-white">Feeling understood</span>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[10%] -left-[5%] hidden sm:flex flex-col gap-4 bg-hmo-card/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-20 min-w-[200px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">A</div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-1.5 w-16 bg-white/10 rounded-full"></div>
                    <div className="h-1.5 w-10 bg-white/10 rounded-full"></div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User as UserIcon, ShieldAlert, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return setError('Please choose a username');
    if (username.length < 3) return setError('Username must be at least 3 characters');
    
    // Simple validation rules
    if (username.toLowerCase().includes('admin') || username.toLowerCase().includes('staff')) {
      return setError('This username is not allowed');
    }

    try {
      await signup(email, password, username);
      navigate('/feed');
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center p-4">
      <motion.div 
        layout
        className="w-full max-w-md bg-hmo-card border border-hmo-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
            <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handleNext} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white/5 border border-hmo-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-hmo-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-hmo-border text-white py-4 rounded-xl font-bold mt-4 hover:bg-white/10 transition-all group"
              >
                Next Step <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handleSignup} 
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                  <ShieldAlert className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">One-Time Anonymous Username</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This cannot be changed later. Use an anonymous name (e.g., SilentOwl). Do not use your real name.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter anonymous username"
                    className="w-full bg-white/5 border border-hmo-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-bold"
                    autoFocus
                  />
                  {username.length >= 3 && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                  )}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pl-1 font-medium italic">
                  <p>• Cannot be changed later</p>
                  <p>• Must not be a real name</p>
                  <p>• No inappropriate language</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/5 border border-hmo-border rounded-xl font-bold text-slate-400 hover:text-white transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-gradient-to-br from-primary to-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-glow hover:translate-y-[-2px] transition-all"
                >
                  Create Account
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-500 text-sm mt-8">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;

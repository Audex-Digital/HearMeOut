/**
 * Signup.tsx
 * 
 * The registration gateway for new users.
 * Orchestrates a complex multi-step state change:
 * 1. Creates a Firebase Auth account.
 * 2. Initializes a custom Firestore profile document.
 * 3. Implicitly triggers an email verification flow.
 * 
 * Features:
 * - Real-time validation visual feedback.
 * - Error handling for partially successful creations (Auth created but Firestore failed).
 * 
 * Dependencies:
 * - useAuth (Signup logic & state)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<'yes' | 'no' | 'checking' | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signup, checkUsernameAvailability } = useAuth();
  const navigate = useNavigate();

  /** Real-time availability check with debounce. */
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsAvailable('checking');
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(username);
      setIsAvailable(available ? 'yes' : 'no');
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  /** 
   * Orchestrates the registration flow.
   * Logic: 
   * - Performs sanity checks.
   * - Calls the AuthContext `signup` handler.
   * - On success, redirects to profile for verification instructions.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return toast.error("All details are required.");
    if (username.length < 3) return toast.error("Username must be 3+ characters.");
    if (isAvailable === 'no') return toast.error("This username is already taken.");
    if (password.length < 6) return toast.error("Security: Password must be 6+ characters.");
    
    setLoading(true);
    try {
      await signup(email, password, username);
      toast.success("Account created! Check your email to verify.");
      navigate('/profile');
    } catch (err: any) {
      if (err.code === 'firestore/creation-failed') {
        // Edge Case: Auth worked but Firestore profile setup failed.
        // The user is logged in but has no profile document. 
        // Redirect to profile where the UI handles this recovery.
        navigate('/profile');
      }
      // General errors (auth/email-already-in-use, etc) are toasted by AuthContext.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative z-10"
      >
        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-accent to-primary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-accent/20 transform rotate-6">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">Create Account</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Join a safe space for open thoughts.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unique Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourhandle"
                className={`w-full bg-hmo-dark border ${isAvailable === 'no' ? 'border-red-500/50' : isAvailable === 'yes' ? 'border-green-500/50' : 'border-hmo-border'} rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/50 focus:ring-4 focus:ring-white/5 transition-all text-sm font-medium`}
              />
              {/* Availability Indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isAvailable === 'checking' && <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                {isAvailable === 'yes' && <div className="text-green-500 text-xs font-black uppercase tracking-tighter">Free</div>}
                {isAvailable === 'no' && <div className="text-red-500 text-xs font-black uppercase tracking-tighter">Taken</div>}
              </div>
            </div>
            {isAvailable === 'no' && <p className="text-[9px] text-red-400 font-bold ml-1 uppercase">Choose a different handle</p>}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Work/Personal Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yours@example.com"
                className="w-full bg-hmo-dark border border-hmo-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Set Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 chars"
                className="w-full bg-hmo-dark border border-hmo-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Privacy Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-white/5 border border-hmo-border rounded-2xl my-6">
            <ShieldCheck size={20} className="text-primary shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium capitalize">
                Your privacy is our priority. We handle your data according to our secure, anonymous standards.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-primary text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? "Initializing..." : "Register Now"}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /> }
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Already a member?{' '}
            <Link to="/login" className="text-accent font-bold hover:underline transition-all underline-offset-4">
              Login Instead
            </Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Signup;

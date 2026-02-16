/**
 * Login.tsx
 * 
 * The entry point for existing users. 
 * Provides an aesthetic, animated form to authenticate with email and password.
 * Includes a secondary action for 'Trial' mode (anonymous login).
 * 
 * Dependencies:
 * - useAuth (Context for login logic)
 * - Framer Motion (Rich entrance/UI animations)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, UserCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);

  const { login, loginAnonymously } = useAuth();
  const navigate = useNavigate();

  /** 
   * Handles standard email authentication.
   * Logic: Triggers AuthContext login, then redirects to feed on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Credentials required.");

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate('/');
    } catch (err: any) {
      // Errors are handled by the Context and toasted there, 
      // but we catch here to stop the loading state.
    } finally {
      setLoading(false);
    }
  };

  /** Initiates an anonymous 'Explorer' session. */
  const handleAnonymousLogin = async () => {
    setIsAnonymousLoading(true);
    try {
      await loginAnonymously();
      toast.success("Welcome, Explorer!");
      navigate('/');
    } catch (err) {
      toast.error("Discovery mode unavailable.");
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[100px] animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative z-10"
      >
        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20 transform -rotate-6">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Continue your journey with the community.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="yours@example.com"
                className="w-full bg-hmo-dark border border-hmo-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-hmo-dark border border-hmo-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/reset-password" className="text-xs font-bold text-primary hover:text-accent transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login"}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-hmo-border"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">or</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-hmo-border"></div>
        </div>

        <button
          onClick={handleAnonymousLogin}
          disabled={isAnonymousLoading}
          className="w-full mt-8 py-4 bg-white/5 border border-hmo-border rounded-2xl text-slate-300 font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-all group disabled:opacity-50"
        >
          <UserCircle size={20} className="group-hover:scale-110 transition-transform" />
          {isAnonymousLoading ? "Exploring..." : "Explore Anonymously"}
        </button>

        <footer className="mt-10 text-center">
          <p className="text-slate-500 text-sm font-medium">
            New to HearMeOut?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline transition-all underline-offset-4">
              Create Account
            </Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Login;

/**
 * ResetPassword.tsx
 * 
 * A secure and aesthetic page for users to reset their passwords.
 * Uses Firebase's sendPasswordResetEmail functionality.
 * 
 * Features:
 * - Email validation
    * - Security best practices(generic success message)
        * - Loading states and error handling
            * - Clean UI matching Login / Signup styling
                */

import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CircleCheckBig } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Basic email regex for client-side validation
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            return toast.error("Please enter your email address.");
        }

        if (!isValidEmail(email)) {
            return toast.error("Please enter a valid email address.");
        }

        setLoading(true);
        try {
            // Configuration for the redirect URL after password reset
            // Ideally, this should be your app's login page or a dedicated landing page
            const actionCodeSettings = {
                url: window.location.origin + '/login',
                handleCodeInApp: true,
            };

            await sendPasswordResetEmail(auth, email, actionCodeSettings);

            // We set specific state to show the success view
            setEmailSent(true);
            toast.success("Reset link sent!");

        } catch (err: any) {
            console.error("Reset Password Error:", err);
            // Security: We generally want to show the same message or a generic error
            // to avoid enumerating valid emails.
            // However, for better UX during valid failures (like network issues), we can check broadly.

            const errorCode = err.code;
            if (errorCode === 'auth/invalid-email') {
                toast.error("Invalid email format.");
            } else {
                // Generic fallback for most errors including 'user-not-found' to prevent enumeration if desired,
                // OR we could just show the success state anyway (pure security).
                // For this implementation, we will show the success state for 'user-not-found' 
                // to mimic a secure flow, OR just toast a generic error for network issues.

                if (errorCode === 'auth/user-not-found') {
                    // Secure response: Don't tell them it failed effectively. 
                    setEmailSent(true);
                } else {
                    toast.error("Something went wrong. Please try again.");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hmo-dark flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Blur Orbs - Consistent with Login */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[100px] animate-pulse-slow"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative z-10"
            >
                <header className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-3">
                        {emailSent ? <CircleCheckBig className="text-white" size={32} /> : <KeyRound className="text-white" size={32} />}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                        {emailSent ? "Check your mail" : "Reset Password"}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">
                        {emailSent
                            ? "We have sent a password recover instruction to your email."
                            : "Enter your email and we'll send you a link to reset your password."}
                    </p>
                </header>

                {!emailSent ? (
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
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-accent text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <p className="text-slate-300 text-sm">
                                Did not receive the email? Check your spam filter, or waiting for a few minutes.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEmailSent(false);
                                setEmail('');
                            }}
                            className="w-full bg-hmo-dark border border-hmo-border text-slate-300 hover:text-white rounded-2xl py-4 font-bold text-sm transition-all"
                        >
                            Try another email address
                        </button>
                    </div>
                )}

                <footer className="mt-10 text-center">
                    <Link to="/login" className="inline-flex items-center text-slate-500 text-sm font-medium hover:text-primary transition-colors gap-2 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                </footer>
            </motion.div>
        </div>
    );
};

export default ResetPassword;

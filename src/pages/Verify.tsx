import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { auth } from '../firebase/config';
import { Mail, RefreshCcw, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Verify.tsx
 * 
 * A dedicated page for users who have registered but not yet verified their email.
 * This page acts as a barrier to ensure account authenticity before full access.
 * 
 * Features:
 * - Real-time status polling (via manual "I've Verified" trigger).
 * - Email verification resending with status feedback.
 * - Automatic redirection based on auth state.
 */
const Verify: React.FC = () => {
  const { user, refreshAuth, resendVerificationEmail, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  // Route protection and automatic redirection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Handle case where auth.currentUser is null
        navigate('/signup');
      } else if (user.emailVerified) {
        // If true -> redirect to /profile
        navigate('/profile');
      }
    }
  }, [user, authLoading, navigate]);

  /**
   * Manually triggers a reload of the Firebase Auth user object
   * to check if the 'emailVerified' flag has changed since login.
   */
  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      // Direct reload call as requested
      await auth.currentUser?.reload();
      
      // Update global context state
      await refreshAuth();
      
      if (auth.currentUser?.emailVerified) {
        toast.success("Identity confirmed! Welcome aboard.");
        navigate('/profile');
      } else {
        // If false -> show an error message in the UI (not alert)
        // Note: Using toast as it fits the "not alert" and matches app style
        toast.error("We couldn't confirm your verification. Please check your inbox and click the link first.");
      }
    } catch (error: any) {
      console.error("Verification check failed:", error);
      toast.error(error.message || "Something went wrong while checking your status.");
    } finally {
      setChecking(false);
    }
  };

  /**
   * Requests a new verification email from Firebase.
   */
  const handleResendEmail = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      // Show a success message in the UI
      toast.success("A fresh verification link has been sent to your email.");
    } catch (error: any) {
      console.error("Resend failed:", error);
      toast.error(error.message || "Failed to resend email. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-hmo-dark flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        <header className="mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-accent to-primary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-accent/20">
            <Mail className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold hmo-text-primary mb-3 leading-tight tracking-tight">Verify Your Email</h1>
          <p className="hmo-text-secondary text-sm font-medium leading-relaxed">
            Check your email inbox at <span className="text-primary font-bold">{user?.email}</span> and click the verification link to activate your account.
          </p>
        </header>

        <div className="space-y-4">
          {/* Primary Action */}
          <button
            onClick={handleCheckVerification}
            disabled={checking || resending}
            className="w-full bg-gradient-to-r from-accent to-primary text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                I've Verified
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Secondary Action */}
          <button
            onClick={handleResendEmail}
            disabled={checking || resending}
            className="w-full hmo-text-muted hover:hmo-text-primary py-2 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <RefreshCcw size={14} />
                Resend Verification Email
              </>
            )}
          </button>
        </div>

        <footer className="mt-10 pt-8 border-t border-hmo-border/50">
          <p className="hmo-text-muted text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Can't find it? Check your spam folder or wait a few minutes before resending.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Verify;

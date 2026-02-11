/**
 * EditProfile.tsx
 * 
 * Simple form for users to modify their personal profile details.
 * Currently supports updating the 'bio' field while keeping the username immutable.
 * 
 * Dependencies:
 * - useAuth (Profile update handler)
 * - Firebase Firestore (updateDoc via AuthContext)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, ChevronLeft, Info } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const EditProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Guard: If Auth is lost, don't render the form.
  if (!user) return null;

  /** 
   * Updates the user's Firestore document.
   * Logic: 
   * - Restricts updates to verified users only.
   * - Triggers context update and then redirects back to profile view.
   */
  const handleSave = async () => {
    if (!user?.emailVerified) return;
    
    setIsSaving(true);
    try {
      await updateProfile({ bio });
      navigate('/profile');
    } catch (err) {
      console.error("Save failure:", err);
      // Errors toasted by the AuthContext.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-xl">
        {/* Navigation Link */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-[10px] font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Profile Overview
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-white leading-tight">Identity Settings</h1>
            <p className="text-slate-500 text-sm font-medium">Customize how you're seen by the community.</p>
          </header>

          <div className="space-y-8">
            {/* Read-Only Username Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">My Secret Handle</label>
              <div className="w-full px-5 py-4 bg-white/5 border border-hmo-border rounded-2xl text-slate-400 cursor-not-allowed text-sm font-bold">
                @{user.username}
              </div>
              <p className="mt-2 text-[10px] text-slate-600 font-medium italic">Handles are immutable to ensure community continuity.</p>
            </div>

            {/* Editable Bio Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">About / Public Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a piece of your journey..."
                className="w-full h-40 px-5 py-4 bg-white/5 border border-hmo-border rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            {/* Privacy Shield Info */}
            <div className="flex items-start gap-4 p-5 bg-white/5 border border-hmo-border rounded-2xl">
              <Info size={20} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                <span className="text-white font-bold block mb-1">Safety First.</span> Your personal information is never shared. Bio content should avoid specific real-world identifiers to maintain anonymity.
              </p>
            </div>

            {/* Submit Control */}
            <button 
              onClick={handleSave}
              disabled={isSaving || !user?.emailVerified}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-primary to-accent text-white py-4 rounded-2xl font-bold hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:translate-y-0 text-xs uppercase tracking-widest"
            >
              {!user?.emailVerified ? "Verification Required" : (isSaving ? "Syncing..." : <><Save size={18} /> Update Profile</>)}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;

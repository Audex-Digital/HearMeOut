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
import { Save, ChevronLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

import LoggedLayout from '../components/Layout/LoggedLayout';

const EditProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  /** 
   * Updates the user's Firestore document.
   */
  const handleSave = async () => {
    if (!user?.emailVerified) return;
    
    setIsSaving(true);
    try {
      await updateProfile({ bio });
      navigate('/profile');
    } catch (err) {
      console.error("Save failure:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LoggedLayout>
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ChevronLeft size={16} />
          Profile Overview
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-12 shadow-2xl"
        >
          <header className="mb-10">
            <h1 className="text-xl font-black text-white leading-tight uppercase tracking-widest">Settings</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">Manage your anonymous identity</p>
          </header>

          <div className="space-y-10">
            {/* Read-Only Username Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Handle (Immutable)</label>
              <div className="w-full px-6 py-4 bg-[#05070a]/50 border border-hmo-border rounded-2xl text-slate-400 cursor-not-allowed text-sm font-bold">
                @{user.username}
              </div>
            </div>

            {/* Editable Bio Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">About Me</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a piece of your journey..."
                className="w-full h-40 px-6 py-6 bg-[#05070a]/50 border border-hmo-border rounded-3xl text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 transition-all resize-none text-sm leading-relaxed font-medium"
              />
            </div>

            {/* Submit Control */}
            <button 
              onClick={handleSave}
              disabled={isSaving || !user?.emailVerified}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
            >
              {!user?.emailVerified ? "Verification Required" : (isSaving ? "Syncing..." : <><Save size={18} /> Update Profile</>)}
            </button>
            
            {!user?.emailVerified && (
              <p className="text-center text-[10px] text-red-500 font-bold uppercase tracking-wider">
                Please verify your email to unlock settings.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </LoggedLayout>
  );
};

export default EditProfile;

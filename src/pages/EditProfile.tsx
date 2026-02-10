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

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ bio });
      navigate('/profile');
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-xl">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ChevronLeft size={16} />
          Back to Profile
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border rounded-3xl p-6 sm:p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-8">Edit Profile</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <div className="w-full px-4 py-3 bg-white/5 border border-hmo-border rounded-xl text-slate-400 cursor-not-allowed">
                {user.username}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Username is locked and cannot be changed for safety.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">About / Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a bit about yourself..."
                className="w-full h-32 px-4 py-3 bg-white/5 border border-hmo-border rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 border border-hmo-border rounded-xl">
              <Info size={18} className="text-accent shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-white font-medium">Privacy Note:</span> Your identity is never shown. This bio is only visible to you on this page and potentially to friends if you accept their request.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-accent text-white py-4 rounded-2xl font-bold hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary-glow transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;

import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Calendar, Edit3, Users, Shield } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-hmo-card border border-hmo-border rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Cover/Header area */}
          <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20"></div>
          
          <div className="px-5 sm:px-8 pb-8 relative">
            <div className="absolute -top-12 left-5 sm:left-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-hmo-card border-4 border-hmo-dark flex items-center justify-center text-primary shadow-xl">
                <UserIcon size={32} className="sm:size-[40px]" />
              </div>
            </div>

            <div className="pt-12 sm:pt-16 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{user.username}</h1>
                <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  Member since {user.memberSince}
                </p>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button 
                  onClick={() => navigate('/edit-profile')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-hmo-border rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-hmo-border rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                  <Users size={16} />
                  Requests
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">About</h3>
                <p className="text-slate-300 leading-relaxed">
                  {user.bio || "No bio yet. Tell the community a bit about yourself (anonymously)."}
                </p>
              </div>

              {/* Friend Requests Section */}
              <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incoming Friend Requests</h3>
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">1 NEW</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-hmo-dark/50 border border-hmo-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">S</div>
                      <span className="text-sm font-semibold text-white">SilentStar</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">Accept</button>
                      <button className="px-3 py-1.5 bg-white/5 border border-hmo-border text-slate-400 text-xs font-bold rounded-lg hover:text-white transition-colors">Decline</button>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-500 italic flex items-center gap-1">
                  <Shield size={10} /> Private chat is only enabled after mutual acceptance.
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <Shield size={20} className="text-primary" />
                <p className="text-sm text-slate-400">
                  <span className="text-white font-medium">Private Profile.</span> Your identity is only visible to you. Posts show your anonymous username.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">0</p>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Posts Shared</p>
          </div>
          <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">0</p>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Friends</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

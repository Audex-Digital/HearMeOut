/**
 * Profile.tsx
 * 
 * User profile dashboard. 
 * Allows users to view their statistics, manage friend connections/requests, 
 * handle email verification, and promote anonymous accounts to permanent accounts.
 * 
 * Features:
 * - Dynamic data fetching for Friend/Request sender profiles.
 * - Cooldown-managed verification email resending.
 * - Account linking for anonymous explorers.
 * - Social connection management (Accept, Decline, Remove).
 * 
 * Dependencies:
 * - useAuth (Global user state & handlers)
 * - Firebase Firestore (getDoc for profile serialization)
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Calendar, 
  Edit3, 
  Check, 
  X,
  Users,
  ShieldAlert,
  Headphones,
  Clock,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';


import LoggedLayout from '../components/Layout/LoggedLayout';

/** Simplified user data used for rendering lists of friends/requests. */
interface UserProfile {
  uid: string;
  username: string;
}

const Profile: React.FC = () => {
  const { 
    user, 
    incomingRequests,
    loading, 
    acceptFriendRequest, 
    rejectFriendRequest,
    applyToBeListener,
    toggleListenerActive
  } = useAuth();
  const navigate = useNavigate();
  
  // State for serialized user lists
  const [requestSenders, setRequestSenders] = useState<UserProfile[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  /**
   * Data Fetching Effect.
   * Syncs the requestSenders state whenever incomingRequests changes.
   */
  useEffect(() => {
    const fetchSenders = async () => {
      if (!incomingRequests?.length) {
        setRequestSenders([]);
        return;
      }
      
      setLoadingRequests(true);
      const senders: UserProfile[] = [];
      for (const req of incomingRequests) {
        try {
          // Check if we have the username in the request doc first (cache)
          if (req.fromUsername) {
            senders.push({ uid: req.from, username: req.fromUsername });
          } else {
            const docSnap = await getDoc(doc(db, 'users', req.from));
            if (docSnap.exists()) {
              senders.push({ uid: req.from, username: docSnap.data().username });
            }
          }
        } catch (error) {
          console.error("Error fetching request sender profile:", error);
        }
      }
      setRequestSenders(senders);
      setLoadingRequests(false);
    };

    fetchSenders();
  }, [incomingRequests]);

  if (loading) {
    return (
      <LoggedLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="hmo-text-muted text-sm font-medium">Syncing profile...</p>
        </div>
      </LoggedLayout>
    );
  }

  if (!user) return null;

  return (
    <LoggedLayout>
      <div className="max-w-xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hmo-card p-8 sm:p-12 text-center shadow-2xl dark:shadow-none overflow-hidden relative"
        >
          {/* Main Profile Info */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-50 dark:bg-[#1a1c2e] border border-hmo-border flex items-center justify-center text-primary mb-6 shadow-sm dark:shadow-glow">
              <UserIcon size={48} className="opacity-80" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black hmo-text-primary mb-2 tracking-tight">
              @{user.username || 'AnonymousUser'}
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 hmo-text-muted text-xs font-bold uppercase tracking-wider">
                <Calendar size={14} />
                Member since {user.memberSince || 'February 2026'}
              </div>
              {user.role === 'admin' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                  <ShieldAlert size={12} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin</span>
                </div>
              )}
              {user.role === 'listener' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <Headphones size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Listener</span>
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="mb-10 relative">
            <div className="absolute -top-3 left-6 px-3 bg-slate-50 dark:bg-hmo-card hmo-text-muted text-[10px] font-black uppercase tracking-widest z-10">
              About
            </div>
            <div className="bg-slate-50 dark:bg-[#05070a]/50 border border-hmo-border rounded-3xl p-8 italic">
              <p className="hmo-text-secondary text-sm leading-relaxed">
                "{user.bio || "No bio yet. Just listening..."}"
              </p>
            </div>
          </div>

          {/* Listener Application / Status */}
          {user.role === 'user' && (
            <div className="mb-10">
              {user.listenerStatus === 'none' ? (
                <button 
                  onClick={applyToBeListener}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-sm font-bold hover:bg-indigo-500/20 transition-all active:scale-95"
                >
                  <Headphones size={18} />
                  Become a Listener
                </button>
              ) : user.listenerStatus === 'pending' ? (
                <div className="py-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-sm font-bold text-yellow-500/60 flex items-center justify-center gap-2">
                  <Clock size={18} />
                  Application Pending Approval
                </div>
              ) : user.listenerStatus === 'rejected' && (
                <div className="py-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-sm font-bold text-red-500/60 flex items-center justify-center gap-2">
                  <XCircle size={18} />
                  Application Rejected
                </div>
              )}
            </div>
          )}

          {/* Listener Active Toggle */}
          {user.role === 'listener' && (
            <div className="mb-10 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-black hmo-text-primary uppercase tracking-wider">Active Status</h3>
                  <p className="text-[10px] hmo-text-muted font-bold uppercase tracking-widest mt-0.5">
                    {user.listenerActive ? 'Visible to users seeking help' : 'Currently offline'}
                  </p>
                </div>
                <button 
                  onClick={() => toggleListenerActive(!user.listenerActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.listenerActive ? 'bg-primary' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.listenerActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/edit-profile')}
                className="flex items-center justify-center gap-2 py-4 hmo-button-ghost rounded-2xl text-sm font-bold active:scale-95"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
              <button 
                onClick={() => setShowRequests(!showRequests)}
                className="flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
              >
                <Users size={18} />
                Friend Requests
                {incomingRequests.length > 0 && (
                  <span className="bg-white text-primary text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {user.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-sm font-bold hover:bg-indigo-500/20 transition-all active:scale-95"
              >
                <ShieldAlert size={18} />
                Admin Dashboard
              </button>
            )}
          </div>

          {/* Requests Panel (Conditional) */}
          <AnimatePresence>
            {showRequests && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-slate-50 dark:bg-[#05070a]/50 border border-hmo-border rounded-3xl p-6 text-left">
                  <h3 className="text-xs font-bold hmo-text-muted uppercase tracking-widest mb-4">Pending Requests</h3>
                  <div className="space-y-3">
                    {loadingRequests ? (
                      <p className="text-xs text-slate-600 animate-pulse">Scanning...</p>
                    ) : requestSenders.length === 0 ? (
                      <p className="text-xs hmo-text-muted italic">No pending connections.</p>
                    ) : (
                      requestSenders.map(sender => (
                        <div key={sender.uid} className="flex items-center justify-between p-3 bg-hmo-card border border-hmo-border rounded-xl">
                          <span className="text-sm font-bold hmo-text-primary">@{sender.username}</span>
                          <div className="flex gap-2">
                            <button onClick={() => acceptFriendRequest(sender.uid)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><Check size={16} /></button>
                            <button onClick={() => rejectFriendRequest(sender.uid)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X size={16} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] font-medium hmo-text-muted tracking-wide uppercase">
            This profile is anonymous. Your real identity is never revealed.
          </p>
        </motion.div>
      </div>
    </LoggedLayout>
  );
};

export default Profile;

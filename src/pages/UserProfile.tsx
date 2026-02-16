/**
 * UserProfile.tsx
 * 
 * Public profile page for all community members.
 * Accessible via /profile/:userId.
 * 
 * Features:
 * - Real-time friend status checking (Connect, Request Sent, Mutual Friend).
 * - Statistics display (Connections count).
 * - Support for both standard and guest profiles.
 * 
 * Dependencies:
 * - useAuth (Social controls & current user state)
 * - Firebase Firestore (getDoc for profile data)
 * - Framer Motion (Entrance transitions)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Calendar, 
  Shield, 
  UserX, 
  UserPlus, 
  UserCheck, 
  Clock, 
  ArrowLeft,
  MessageSquare,
  UserMinus
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { alertService } from '../utils/sweetalert';

/** Full profile data for the target user. */
interface TargetUserData {
  uid: string;
  username: string;
  memberSince: string;
  bio?: string;
  role: string;
  friends?: string[];
  isAnonymous?: boolean;
}

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { 
    user: currentUser, 
    friends,
    incomingRequests,
    outgoingRequests,
    sendFriendRequest, 
    removeFriend, 
    cancelFriendRequest 
  } = useAuth();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<TargetUserData | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);

  /**
   * Data Fetching.
   * Pulls the target profile from Firestore using usernameLowercase.
   * Future enhancement: Support redirects for users who have changed their usernames.
   */
  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (!username) return;
      
      const normalizedUsername = username.replace(/^@/, '').toLowerCase();
      
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('usernameLowercase', '==', normalizedUsername),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const uid = userDoc.id;
          setTargetUser({ uid, ...userDoc.data() } as TargetUserData);

          // Fetch friend count from friend_requests collection
          const fq = query(
            collection(db, 'friend_requests'),
            where('participants', 'array-contains', uid),
            where('status', '==', 'accepted')
          );
          const fSnap = await getDocs(fq);
          setFriendCount(fSnap.size);
        } else {
          setTargetUser(null);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchTargetProfile();
  }, [username]);

  /** Checks the current social relationship between the logged-in user and target. */
  const getSocialState = () => {
    if (!currentUser || !targetUser) return 'none';
    if (currentUser.uid === targetUser.uid) return 'self';
    
    // Check mutual friends (Source of Truth: AuthContext friends state)
    if (friends.includes(targetUser.uid)) return 'friends';
    
    // Check pending requests
    if (outgoingRequests.some(req => req.to === targetUser.uid)) return 'request_sent';
    if (incomingRequests.some(req => req.from === targetUser.uid)) return 'request_received';
    
    return 'none';
  };

  const socialState = getSocialState();

  /** Handlers for social actions. */
  const handleConnect = async () => {
    if (!targetUser) return;
    setSocialLoading(true);
    try {
      await sendFriendRequest(targetUser.uid);
      // Feedback is handled in AuthContext
    } catch (err) {
      console.error("Connect error:", err);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!targetUser) return;
    const confirmed = await alertService.confirm(
      "Sever Connection", 
      `Are you sure you want to disconnect from @${targetUser.username}?`
    );
    if (!confirmed) return;
    
    setSocialLoading(true);
    try {
      await removeFriend(targetUser.uid);
      toast.success("Relationship severed.");
    } catch (err) {
      console.error("Remove error:", err);
      toast.error("Failed to disconnect.");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!targetUser) return;
    setSocialLoading(true);
    try {
      await cancelFriendRequest(targetUser.uid);
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setSocialLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="pt-28 pb-10 min-h-screen bg-hmo-dark flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="hmo-text-muted text-sm font-bold uppercase tracking-widest">Scanning Identity...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!targetUser) {
    return (
      <div className="pt-28 pb-10 min-h-screen bg-hmo-dark flex items-center justify-center transition-colors duration-300">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 border border-hmo-border rounded-3xl mx-auto mb-8 flex items-center justify-center hmo-text-muted">
            <UserX size={40} />
          </div>
          <h1 className="text-2xl font-bold hmo-text-primary mb-2">User Not Found</h1>
          <p className="hmo-text-secondary text-sm mb-8 leading-relaxed">The profile you are looking for might have been removed or never existed.</p>
          <button 
            onClick={() => navigate('/feed')}
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <ArrowLeft size={18} />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Navigation Back */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hmo-text-muted hover:hmo-text-primary transition-colors mb-6 text-[10px] font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hmo-card overflow-hidden shadow-2xl dark:shadow-none"
        >
          {/* Cover Header */}
          <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10 relative">
            {targetUser.role === 'admin' && (
              <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg backdrop-blur-md">
                <Shield size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase">Staff Profile</span>
              </div>
            )}
          </div>
          
          <div className="px-6 sm:px-10 pb-10 relative">
            {/* Avatar */}
            <div className="absolute -top-12 left-6 sm:left-10">
              <div className="w-24 h-24 rounded-2xl bg-hmo-card border-4 border-hmo-dark flex items-center justify-center text-primary shadow-2xl">
                <UserIcon size={40} />
              </div>
            </div>

            {/* Profile Info & Actions Bar */}
            <div className="pt-16 flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2 hmo-text-primary">
                  <h1 className="text-2xl font-bold">@{targetUser.username}</h1>
                  {targetUser.isAnonymous && (
                    <span className="px-2 py-0.5 bg-accent/20 border border-accent/20 rounded-md text-[9px] font-black uppercase text-accent">Guest</span>
                  )}
                </div>
                <div className="flex items-center gap-4 hmo-text-muted text-xs font-semibold">
                  <p className="flex items-center gap-1.5 uppercase tracking-tighter">
                    <Calendar size={14} className="hmo-text-muted opacity-70" />
                    Joined {targetUser.memberSince}
                  </p>
                  <p className="flex items-center gap-1.5 uppercase tracking-tighter">
                    <Shield size={14} className="hmo-text-muted opacity-70" />
                    Secure Identity
                  </p>
                </div>
              </div>

              {/* Action Buttons based on Social State */}
              <div className="flex gap-3 w-full sm:w-auto">
                {socialState === 'self' ? (
                  <Link 
                    to="/edit-profile"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 hmo-button-ghost"
                  >
                    Edit My Bio
                  </Link>
                ) : socialState === 'friends' ? (
                  <>
                    <button 
                      onClick={() => navigate(`/chat/${targetUser.uid}`)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      <MessageSquare size={16} />
                      Chat
                    </button>
                    <button 
                      onClick={handleDisconnect}
                      disabled={socialLoading}
                      className="p-3 bg-slate-50 dark:bg-white/5 border border-hmo-border hmo-text-muted hover:text-red-500 rounded-xl transition-all"
                    >
                      <UserMinus size={18} />
                    </button>
                  </>
                ) : socialState === 'request_sent' ? (
                  <button 
                    onClick={handleCancelRequest}
                    disabled={socialLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 dark:bg-white/10 border border-hmo-border hmo-text-muted rounded-xl text-xs font-bold transition-all hover:text-red-500 hover:border-red-500/30 group"
                  >
                    <Clock size={16} className="group-hover:hidden" />
                    <span className="group-hover:hidden">Pending...</span>
                    <span className="hidden group-hover:block">Cancel Request</span>
                  </button>
                ) : socialState === 'request_received' ? (
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-xs font-bold"
                  >
                    <UserCheck size={16} />
                    Review Request
                  </button>
                ) : (
                  <button 
                    onClick={handleConnect}
                    disabled={socialLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                    {socialLoading ? "Connecting..." : "Connect Anonymously"}
                  </button>
                )}
              </div>
            </div>

            {/* Bio Card */}
            <div className="p-6 bg-slate-50 dark:bg-white/[0.03] border border-hmo-border rounded-2xl mb-8">
              <h3 className="text-[10px] font-bold hmo-text-muted uppercase tracking-widest mb-3">About the Explorer</h3>
              <p className="hmo-text-secondary leading-relaxed text-sm">
                {targetUser.bio || "This explorer prefers to let their thoughts speak for them. (No bio provided)"}
              </p>
            </div>

            {/* Statistics Bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-hmo-border rounded-2xl text-center">
                <p className="text-xl font-bold hmo-text-primary mb-0.5">{friendCount}</p>
                <p className="text-[9px] font-bold hmo-text-muted uppercase tracking-widest">Safe Connections</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-hmo-border rounded-2xl text-center">
                <p className="text-xl font-bold hmo-text-primary mb-0.5">Active</p>
                <p className="text-[9px] font-bold hmo-text-muted uppercase tracking-widest">Community Status</p>
              </div>
            </div>

            {/* Footer Privacy Disclaimer */}
            <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <Shield size={18} className="text-primary shrink-0" />
              <p className="text-[10px] hmo-text-secondary leading-relaxed">
                <span className="hmo-text-primary font-bold">Privacy First.</span> All user interactions on HearMeOut are encrypted and anonymized. 
                We never store personal identifiers linked to public handles.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfile;

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
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Calendar, 
  Edit3, 
  Shield, 
  UserX, 
  Check, 
  X, 
  MessageSquare, 
  UserMinus, 
  AlertTriangle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { alertService } from '../utils/sweetalert';
import Footer from '../components/Footer/Footer';


/** Simplified user data used for rendering lists of friends/requests. */
interface UserProfile {
  uid: string;
  username: string;
}

const Profile: React.FC = () => {
  const { 
    user, 
    loading, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend, 
    refreshAuth, 
    resendVerificationEmail, 
    linkAccount 
  } = useAuth();
  const navigate = useNavigate();
  
  // State for serialized user lists (since Firestore only stores UIDs in the arrays)
  const [requestSenders, setRequestSenders] = useState<UserProfile[]>([]);
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  // Verification management state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Account linking (Anonymous -> Permanent) state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkUsername, setLinkUsername] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  /**
   * Cooldown Timer Effect.
   * Decrements the `resendCooldown` every second to prevent email span.
   */
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /** Triggers the Firebase verification email flow with cooldown logic. */
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setResendCooldown(60); // 1-minute throttle
      toast.success("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please wait a while.");
        setResendCooldown(60);
      } else {
        toast.error("Failed to send email. Try again later.");
      }
    } finally {
      setIsResending(false);
    }
  };

  /** Upgrades an anonymous guest account by linking email credentials. */
  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkPassword || !linkUsername) return toast.error("Please fill in all fields");
    setIsLinking(true);
    try {
      await linkAccount(linkEmail, linkPassword, linkUsername);
      toast.success("Account successfully linked! Verify your email to finish.");
      setShowLinkForm(false);
    } catch (err: any) {
      toast.error("Linking failed: " + err.message);
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Data Fetching Effect.
   * Serializes the UIDs found in `friendRequestsReceived` and `friends` arrays 
   * into human-readable username objects.
   */
  useEffect(() => {
    const fetchSenders = async () => {
      // Permission: Verified users or Anonymous users (if allowed) can see relationships
      if (!user?.emailVerified && !user?.isAnonymous) {
        setRequestSenders([]);
        return;
      }
      if (!user?.friendRequestsReceived?.length) {
        setRequestSenders([]);
        return;
      }
      
      setLoadingRequests(true);
      const senders: UserProfile[] = [];
      for (const uid of user.friendRequestsReceived) {
        try {
          const docSnap = await getDoc(doc(db, 'users', uid));
          if (docSnap.exists()) {
            senders.push({ uid, username: docSnap.data().username });
          }
        } catch (error) {
          console.error("Error fetching request sender profile:", error);
        }
      }
      setRequestSenders(senders);
      setLoadingRequests(false);
    };

    const fetchFriends = async () => {
      if (!user?.emailVerified && !user?.isAnonymous) {
        setFriendsList([]);
        return;
      }
      if (!user?.friends?.length) {
        setFriendsList([]);
        return;
      }

      setLoadingFriends(true);
      const friends: UserProfile[] = [];
      for (const uid of user.friends) {
        try {
          const docSnap = await getDoc(doc(db, 'users', uid));
          if (docSnap.exists()) {
            friends.push({ uid, username: docSnap.data().username });
          }
        } catch (error) {
          console.error("Error fetching friend profile:", error);
        }
      }
      setFriendsList(friends);
      setLoadingFriends(false);
    };

    if (user) {
      fetchSenders();
      fetchFriends();
    }
  }, [user?.friendRequestsReceived, user?.friends, user?.emailVerified, user?.isAnonymous]);

  // Loading Splash Screen
  if (loading) {
    return (
      <div className="pt-28 pb-10 min-h-screen bg-hmo-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error/Empty State: No Auth Session
  if (!user) {
    return (
      <div className="pt-28 pb-10 min-h-screen bg-hmo-dark flex items-center justify-center">
        <div className="bg-hmo-card border border-hmo-border p-8 rounded-3xl text-center max-w-sm mx-4">
          <UserX size={48} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">We couldn't find the user data you were looking for.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  /** Severs a mutual connection with confirmation check. */
  const handleRemoveFriend = async (friendUid: string) => {
    const confirmed = await alertService.delete('this connection');
    if (confirmed) {
      try {
        await removeFriend(friendUid);
        toast.success("Relationship severed.");
      } catch (err) {
        console.error("Failed to remove friend:", err);
        toast.error("Failed to sever connection.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-hmo-dark">
      <div className="flex-grow pt-28 pb-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-hmo-card border border-hmo-border rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Visual Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20"></div>
            
            <div className="px-5 sm:px-8 pb-8 relative">
              {/* Avatar Decoration */}
              <div className="absolute -top-12 left-5 sm:left-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-hmo-card border-4 border-hmo-dark flex items-center justify-center text-primary shadow-xl">
                  <UserIcon size={32} className="sm:size-[40px]" />
                </div>
              </div>

              {/* Profile Info Bar */}
              <div className="pt-12 sm:pt-16 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.username || 'Anonymous User'}</h1>
                    {user?.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-md text-[10px] font-bold text-primary uppercase tracking-wider">Admin</span>
                    )}
                    {user?.isAnonymous && (
                      <span className="px-2 py-0.5 bg-accent/20 border border-accent/30 rounded-md text-[10px] font-bold text-accent uppercase tracking-wider">Guest Mode</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                    <Calendar size={14} />
                    Member since {user?.memberSince || 'Unknown'}
                  </p>
                  {/* Warning for unverified users */}
                  {!user?.emailVerified && !user?.isAnonymous && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-[10px] font-bold text-red-500 uppercase">Unverified Account</span>
                    </div>
                  )}
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-hmo-border rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Edit3 size={16} />
                    Edit Settings
                  </button>
                  {/* Admin-only Panel Access */}
                  <button 
                    onClick={() => navigate('/admin')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-hmo-border rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all ${user?.role !== 'admin' && 'hidden'}`}
                  >
                    <Shield size={16} />
                    Dashboard
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* --- ANONYMOUS UPGRADE SECTION --- */}
                {user?.isAnonymous && !showLinkForm && (
                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Permanent Registration</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Guest mode is temporary. Upgrade to save your profile permanently and unlock all community features.
                    </p>
                    <button 
                      onClick={() => setShowLinkForm(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                    >
                      Set Email & Password
                    </button>
                  </div>
                )}

                {/* Account Linking Form */}
                {user?.isAnonymous && showLinkForm && (
                  <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Register Profile</h3>
                      <button onClick={() => setShowLinkForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleLinkAccount} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                        <input 
                          type="text"
                          value={linkUsername}
                          onChange={(e) => setLinkUsername(e.target.value)}
                          placeholder="Your public handle"
                          className="w-full bg-hmo-dark border border-hmo-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                        <input 
                          type="email"
                          value={linkEmail}
                          onChange={(e) => setLinkEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-hmo-dark border border-hmo-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Secure Password</label>
                        <input 
                          type="password"
                          value={linkPassword}
                          onChange={(e) => setLinkPassword(e.target.value)}
                          placeholder="Min. 6 chars"
                          className="w-full bg-hmo-dark border border-hmo-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isLinking}
                        className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
                      >
                        {isLinking ? "Processing..." : "Upgrade Account"}
                      </button>
                    </form>
                  </div>
                )}

                {/* --- VERIFICATION PROMPT --- */}
                {!user?.isAnonymous && !user?.emailVerified ? (
                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">Action Required</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Your account is limited until email verification is complete. Check your inbox for the link.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={async () => {
                          try {
                            await refreshAuth();
                            if (user?.emailVerified) {
                              window.location.reload();
                            } else {
                              toast.error("Email still unverified. Refreshing...");
                            }
                          } catch (err) {
                            console.error("Refresh failed:", err);
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all"
                      >
                        I've verified it
                      </button>
                      <button 
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || isResending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-hmo-border rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0 ? `Retry in ${resendCooldown}s` : (isResending ? "Sending..." : "Resend Link")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl transition-colors hover:bg-white/[0.07]">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">About Me</h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {user?.bio || "No bio yet. Tell the community your story (anonymously)."}
                    </p>
                  </div>
                )}

                {/* --- INCOMING REQUESTS --- */}
                {user?.friendRequestsReceived && user.friendRequestsReceived.length > 0 && (
                  <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connection Requests</h3>
                      <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{user.friendRequestsReceived.length} PENDING</span>
                    </div>
                    <div className="space-y-3">
                      {loadingRequests ? (
                        <p className="text-[10px] text-slate-500 italic animate-pulse">Syncing profiles...</p>
                      ) : (
                        requestSenders.map((sender) => (
                          <div key={sender.uid} className="flex items-center justify-between p-3 bg-hmo-dark/50 border border-hmo-border rounded-xl">
                            <Link to={`/profile/@${sender.username}`} className="flex items-center gap-3 group/author">
                              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-xs font-bold group-hover/author:scale-110 transition-transform">
                                {sender.username?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="text-sm font-semibold text-white group-hover:underline">{sender.username || 'User'}</span>
                            </Link>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => acceptFriendRequest(sender.uid)}
                                className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                                title="Accept"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => rejectFriendRequest(sender.uid)}
                                className="w-8 h-8 flex items-center justify-center bg-white/5 border border-hmo-border text-slate-400 rounded-lg hover:text-white transition-colors"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* --- FRIENDS LIST --- */}
                <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Connections</h3>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{user?.friends?.length || 0} Total</span>
                  </div>
                  
                  {loadingFriends ? (
                    <p className="text-[10px] text-slate-500 italic animate-pulse">Scanning connections...</p>
                  ) : !user?.friends || user.friends.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-slate-500 text-xs italic">Safety in numbers. Connect with others from the feed.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friendsList.map((friend) => (
                        <div key={friend.uid} className="flex items-center justify-between p-3 bg-hmo-dark/50 border border-hmo-border rounded-xl group/friend">
                          <Link to={`/profile/@${friend.username}`} className="flex items-center gap-3 group/author">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold group-hover/author:scale-110 transition-transform">
                              {friend.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-semibold text-white group-hover:underline">{friend.username || 'User'}</span>
                          </Link>
                          <div className="flex gap-2">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-accent transition-colors"
                              title="Private Message (Coming Soon)"
                            >
                              <MessageSquare size={16} />
                            </button>
                            <button 
                              onClick={() => handleRemoveFriend(friend.uid)}
                              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                              title="Remove Connection"
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Shield size={20} className="text-primary shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-white font-medium">Privacy Guaranteed.</span> We never track identity. HearMeOut is a safe space for mental health and anonymous support.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dynamic Stats Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center group transition-all hover:border-slate-700">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1">Active</p>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Engagement Level</p>
            </div>
            <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center transition-all hover:border-slate-700">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{user?.friends?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Safe Connections</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;

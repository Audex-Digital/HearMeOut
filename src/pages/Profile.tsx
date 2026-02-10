import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Calendar, Edit3, Shield, UserX, Check, X, MessageSquare, UserMinus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  username: string;
}

const Profile: React.FC = () => {
  const { user, loading, acceptFriendRequest, rejectFriendRequest, removeFriend } = useAuth();
  const navigate = useNavigate();
  const [requestSenders, setRequestSenders] = useState<UserProfile[]>([]);
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    const fetchSenders = async () => {
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
          console.error("Error fetching sender profile:", error);
        }
      }
      setRequestSenders(senders);
      setLoadingRequests(false);
    };

    const fetchFriends = async () => {
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
  }, [user?.friendRequestsReceived, user?.friends]);

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

  const handleRemoveFriend = async (friendUid: string) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await removeFriend(friendUid);
      } catch (err) {
        console.error("Failed to remove friend:", err);
      }
    }
  };

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
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.username || 'Anonymous User'}</h1>
                  {user?.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-md text-[10px] font-bold text-primary uppercase tracking-wider">Admin</span>
                  )}
                </div>
                <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  Member since {user?.memberSince || 'Unknown'}
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
                <button 
                  onClick={() => navigate('/admin')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-hmo-border rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all ${user?.role !== 'admin' && 'hidden'}`}
                >
                  <Shield size={16} />
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl transition-colors hover:bg-white/[0.07]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">About</h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {user?.bio || "No bio yet. Tell the community a bit about yourself (anonymously)."}
                </p>
              </div>

              {/* Friend Requests Section */}
              {user?.friendRequestsReceived && user.friendRequestsReceived.length > 0 && (
                <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incoming Friend Requests</h3>
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{user.friendRequestsReceived.length} NEW</span>
                  </div>
                  <div className="space-y-3">
                    {loadingRequests ? (
                      <p className="text-[10px] text-slate-500 italic animate-pulse">Syncing requests...</p>
                    ) : (
                      requestSenders.map((sender) => (
                        <div key={sender.uid} className="flex items-center justify-between p-3 bg-hmo-dark/50 border border-hmo-border rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                              {sender.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-semibold text-white">{sender.username || 'User'}</span>
                          </div>
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

              {/* Friends List Section */}
              <div className="p-6 bg-white/5 border border-hmo-border rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Friends</h3>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{user?.friends?.length || 0} Total</span>
                </div>
                
                {loadingFriends ? (
                  <p className="text-[10px] text-slate-500 italic animate-pulse">Loading friends list...</p>
                ) : !user?.friends || user.friends.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-slate-500 text-xs italic">No friends yet. Add people from the feed to start connecting.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendsList.map((friend) => (
                      <div key={friend.uid} className="flex items-center justify-between p-3 bg-hmo-dark/50 border border-hmo-border rounded-xl group/friend">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {friend.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-semibold text-white">{friend.username || 'User'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-accent transition-colors"
                            title="Message"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button 
                            onClick={() => handleRemoveFriend(friend.uid)}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                            title="Remove Friend"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security/Privacy Note */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <Shield size={20} className="text-primary shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-white font-medium">Safe Mode Active.</span> Your real identity is never exposed. Conversations and connections are fully anonymous.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center group transition-all hover:border-slate-700">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">0</p>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider italic">Posts Shared</p>
          </div>
          <div className="p-6 bg-hmo-card border border-hmo-border rounded-2xl text-center transition-all hover:border-slate-700">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{user?.friends?.length || 0}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Verified Friends</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

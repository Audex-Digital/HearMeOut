/**
 * NotificationSystem.tsx
 * 
 * Renders high-priority real-time "toast" style notifications in the top-right corner.
 * Listens for *unread* notifications specifically to provide immediate visual feedback
 * for incoming social interactions (likes, comments, friend requests).
 * 
 * Logic:
 * - Clips the stream to the 5 most recent unread notifications.
 * - Provides quick action buttons (Dismiss, Accept, Decline).
 * 
 * Dependencies:
 * - useAuth (Global relationships state)
 * - Framer Motion (Pop-in animations)
 * - Firebase Firestore (query, where, onSnapshot)
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';

/** Structure of the notification document. */
interface Notification {
  id: string;
  type: 'like' | 'comment' | 'friend_request';
  fromUserId: string;
  fromUsername: string;
  postId?: string;
  read: boolean;
  createdAt: any;
}

const NotificationSystem: React.FC = () => {
  const { user, acceptFriendRequest, rejectFriendRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Real-time stream for UNREAD notifications.
   * Only active for verified, non-anonymous users.
   */
  useEffect(() => {
    if (!user?.emailVerified || user?.isAnonymous) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const newNotifs: Notification[] = [];
        snapshot.forEach((doc) => {
          newNotifs.push({ id: doc.id, ...doc.data() } as Notification);
        });
        setNotifications(newNotifs);
      },
      error: (error) => {
        console.error("Real-time notification error:", error);
        toast.error("Failed to sync new alerts.");
      }
    });

    return () => unsubscribe();
  }, [user?.uid, user?.emailVerified]);

  /** Marks a specific notification as 'read', removing it from this component's view. */
  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Manual mark-as-read failed:", err);
      toast.error("Update failed.");
    }
  };

  /**
   * Handles multi-step social actions directly from the toast.
   * Logic: Executes the social logic first, then marks the notification as read.
   */
  const handleAction = async (notif: Notification, action: 'accept' | 'reject' | 'read') => {
    if (notif.type === 'friend_request') {
      if (action === 'accept') await acceptFriendRequest(notif.fromUserId);
      if (action === 'reject') await rejectFriendRequest(notif.fromUserId);
    }
    await markAsRead(notif.id);
  };

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-4 pointer-events-none w-full max-w-xs">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto bg-hmo-card border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10 w-full backdrop-blur-xl group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'like' ? 'bg-pink-500/10 text-pink-500' : 
                notif.type === 'comment' ? 'bg-accent/10 text-accent' : 
                'bg-primary/10 text-primary'
              }`}>
                {notif.type === 'like' && <Heart size={18} fill="currentColor" />}
                {notif.type === 'comment' && <MessageCircle size={18} />}
                {notif.type === 'friend_request' && <Bell size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-snug">
                  <Link 
                    to={`/profile/@${notif.fromUsername}`}
                    onClick={() => markAsRead(notif.id)}
                    className="text-white font-bold hover:underline"
                  >
                    {notif.fromUsername}
                  </Link>
                  {notif.type === 'like' && ' supported your post'}
                  {notif.type === 'comment' && ' replied to your post'}
                  {notif.type === 'friend_request' && ' wants to connect'}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">Just now</span>
              </div>

              <button 
                onClick={() => markAsRead(notif.id)}
                className="text-slate-600 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Friend Request specific action buttons */}
            {notif.type === 'friend_request' && (
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleAction(notif, 'accept')}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <Check size={14} /> Accept
                </button>
                <button 
                  onClick={() => handleAction(notif, 'reject')}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-hmo-border text-slate-300 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
            
            {/* Generic Dismiss for likes/comments */}
            {notif.type !== 'friend_request' && (
              <button 
                onClick={() => markAsRead(notif.id)}
                className="w-full mt-3 py-1.5 bg-white/5 border border-hmo-border rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                Dismiss
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;

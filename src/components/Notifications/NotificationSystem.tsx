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
import { Check, X, Heart, MessageCircle, Headphones, ShieldCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  type: 'like' | 'comment' | 'friend_request' | 'chat_message' | 'listener_application' | 'listener_approved' | 'listener_rejected';
  fromUserId?: string;
  fromUsername?: string;
  applicantUid?: string;
  applicantUsername?: string;
  postId?: string;
  text?: string;
  read: boolean;
  createdAt: any;
}

const NotificationSystem: React.FC = () => {
  const { user, acceptFriendRequest, rejectFriendRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Real-time stream for UNREAD notifications.
   */
  useEffect(() => {
    if (!user) {
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
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  /**
   * AUTO-DISMISS LOGIC
   * Automatically marks notifications as read after 5 seconds to prevent them from
   * sticking on screen indefinitely.
   */
  useEffect(() => {
    if (notifications.length > 0) {
      const timers = notifications.map(notif => {
        // Set a 5-second timer for each incoming high-priority notification
        return setTimeout(() => {
          markAsRead(notif.id);
        }, 5000);
      });

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [notifications]);

  /** Marks a specific notification as 'read', removing it from this component's view. */
  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Manual mark-as-read failed:", err);
    }
  };

  /**
   * Handles multi-step social actions directly from the toast.
   * Logic: Executes the social logic first, then marks the notification as read.
   */
  const handleAction = async (notif: Notification, action: 'accept' | 'reject' | 'read') => {
    if (notif.type === 'friend_request' && notif.fromUserId) {
      const senderUid = notif.fromUserId;
      if (action === 'accept') await acceptFriendRequest(senderUid);
      if (action === 'reject') await rejectFriendRequest(senderUid);
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
                notif.type === 'listener_application' ? 'bg-yellow-500/10 text-yellow-500' :
                notif.type === 'listener_approved' ? 'bg-green-500/10 text-green-500' :
                notif.type === 'listener_rejected' ? 'bg-red-500/10 text-red-500' :
                'bg-primary/10 text-primary'
              }`}>
                {notif.type === 'like' && <Heart size={18} fill="currentColor" />}
                {notif.type === 'comment' && <MessageCircle size={18} />}
                {notif.type === 'chat_message' && <MessageCircle size={18} className="text-indigo-400" />}
                {notif.type === 'friend_request' && <UserPlus size={18} />}
                {notif.type === 'listener_application' && <Headphones size={18} />}
                {notif.type === 'listener_approved' && <ShieldCheck size={18} />}
                {notif.type === 'listener_rejected' && <X size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs hmo-text-secondary leading-snug">
                  {notif.fromUsername && (
                    <Link 
                      to={notif.type === 'chat_message' ? `/chat/${notif.fromUserId}` : `/profile/@${notif.fromUsername}`}
                      onClick={() => markAsRead(notif.id)}
                      className="hmo-text-primary font-bold hover:underline"
                    >
                      {notif.fromUsername}
                    </Link>
                  )}
                  {notif.applicantUsername && (
                    <Link 
                      to={`/chat/${notif.applicantUid}?evaluate=true`}
                      onClick={() => markAsRead(notif.id)}
                      className="hmo-text-primary font-bold hover:underline"
                    >
                      {notif.applicantUsername}
                    </Link>
                  )}
                  {notif.type === 'like' && ' supported your post'}
                  {notif.type === 'comment' && ' replied to your post'}
                  {notif.type === 'chat_message' && (
                    <>
                      {' sent a message: '}
                      <span className="hmo-text-muted italic">"{notif.text}"</span>
                    </>
                  )}
                  {notif.type === 'friend_request' && ' wants to connect'}
                  {notif.type === 'listener_application' && ' applied for Listener role'}
                  {notif.type === 'listener_approved' && 'Your listener application was approved! 🎉'}
                  {notif.type === 'listener_rejected' && 'Your listener application was rejected.'}
                </p>
                <span className="text-[10px] hmo-text-muted mt-1 block font-medium">Just now</span>
              </div>

              <button 
                onClick={() => markAsRead(notif.id)}
                className="hmo-text-muted hover:hmo-text-primary transition-colors"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-white/5 border border-hmo-border hmo-text-secondary py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
            
            {/* Generic Dismiss for likes/comments */}
            {notif.type !== 'friend_request' && (
              <button 
                onClick={() => markAsRead(notif.id)}
                className="w-full mt-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-hmo-border rounded-lg text-[10px] font-bold hmo-text-muted hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
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

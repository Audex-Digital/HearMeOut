/**
 * NotificationPanel.tsx
 * 
 * A slide-out sidebar that lists all historical notifications for the user.
 * Functionality:
 * - Real-time listening for 'notifications' where recipientId == current user.
 * - Automatic "Mark as Read" behavior: when the panel opens, all unread items are batched and updated.
 * - Social Actions: Accept/Decline buttons for friend requests directly within the notification item.
 * 
 * Dependencies:
 * - useAuth (Global state)
 * - Firebase Firestore (query, where, onSnapshot, writeBatch)
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Heart, MessageCircle, UserPlus, Clock, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  writeBatch
} from 'firebase/firestore';

/** Structure of the notification document in Firestore. */
interface Notification {
  id: string;
  type: 'like' | 'comment' | 'friend_request' | 'chat_message' | 'listener_application' | 'listener_approved' | 'listener_rejected';
  fromUserId: string;
  fromUsername: string;
  postId?: string;
  text?: string;
  read: boolean;
  createdAt: any;
}

/** Props for the NotificationPanel component. */
interface NotificationPanelProps {
  /** Visibility state of the panel. */
  isOpen: boolean;
  /** Callback to close the panel. */
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { user, acceptFriendRequest, rejectFriendRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Main Listener Effect.
   * Logic: 
   * - Only active when the panel is open and a user is present.
   * - Restrictions like emailVerified or isAnonymous have been removed to ensure the panel is never incorrectly empty.
   */
  useEffect(() => {
    if (!isOpen || !user) {
      if (!isOpen) {
        setNotifications([]);
        setLoading(true);
      }
      return;
    }

    setLoading(true);
    
    // Clean query targeting the current user's personal notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const fetched: Notification[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Notification);
        });
        
        setNotifications(fetched);
        setLoading(false);

        // --- AUTOMATIC READ STATUS ---
        // If the panel is open, we mark these items as read so the badge count clears.
        const unread = fetched.filter(n => !n.read);
        if (unread.length > 0) {
          const batch = writeBatch(db);
          unread.forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
          });
          batch.commit().catch(err => {
            console.error("Batch update failed:", err);
          });
        }
      },
      error: (error) => {
        console.error("Firestore Notification Panel Error:", error);
        // Display clear feedback for common Firestore issues like missing indexes
        if (error.code === 'failed-precondition') {
          toast.error("Database optimization in progress...");
        } else {
          toast.error("Unable to sync notifications.");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isOpen, user?.uid]);

  /** Formats Firestore Timestamps into human-readable relative strings. */
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Layer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
          />

          {/* Sidebar Drawer */}
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm hmo-card border-l shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-hmo-border flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={18} fill="currentColor" />
                </div>
                <h2 className="text-lg font-black hmo-text-primary tracking-tight uppercase">Activity</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Notification List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] hmo-text-muted font-bold uppercase tracking-widest">Syncing History...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] opacity-50 px-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.02] rounded-full flex items-center justify-center mb-6 border border-hmo-border/50">
                    <Inbox size={40} className="hmo-text-muted opacity-30" />
                  </div>
                  <h3 className="hmo-text-primary font-bold text-sm mb-2 uppercase tracking-wide">Nothing here yet</h3>
                  <p className="text-xs hmo-text-secondary leading-relaxed font-medium">
                    When people support your posts or send connection requests, you'll see them here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-hmo-border/30">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-6 flex gap-4 transition-all group relative ${!notif.read ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.01]'}`}
                    >
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      )}

                      {/* Icon Branding */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                        notif.type === 'like' ? 'bg-pink-500/10 text-pink-500' : 
                        notif.type === 'comment' ? 'bg-accent/10 text-accent' : 
                        notif.type === 'chat_message' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {notif.type === 'like' && <Heart size={18} fill="currentColor" />}
                        {notif.type === 'comment' && <MessageCircle size={18} />}
                        {notif.type === 'chat_message' && <MessageCircle size={18} />}
                        {notif.type === 'friend_request' && <UserPlus size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm hmo-text-secondary leading-relaxed font-medium">
                          <Link 
                            to={notif.type === 'chat_message' ? `/chat/${notif.fromUserId}` : `/profile/@${notif.fromUsername}`} 
                            onClick={onClose}
                            className="hmo-text-primary font-bold hover:text-primary transition-colors"
                          >
                            {notif.fromUsername}
                          </Link>
                          {notif.type === 'like' && ' supported your post'}
                          {notif.type === 'comment' && ' replied to your post'}
                          {notif.type === 'chat_message' && (
                            <>
                              {' sent a message: '}
                              <span className="hmo-text-primary italic font-bold">"{notif.text}"</span>
                            </>
                          )}
                          {notif.type === 'friend_request' && ' wants to connect'}
                          {notif.type === 'listener_application' && ' applied for Listener role'}
                          {notif.type === 'listener_approved' && 'Your listener application was approved! 🎉'}
                          {notif.type === 'listener_rejected' && 'Your listener application was rejected.'}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 opacity-60">
                          <Clock size={12} className="hmo-text-muted" />
                          <span className="text-[10px] hmo-text-muted font-bold uppercase tracking-widest">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        {/* Inline Social Interaction for Friend Requests */}
                        {notif.type === 'friend_request' && (
                          <div className="flex gap-2 mt-4">
                            <button 
                              onClick={() => {
                                acceptFriendRequest(notif.fromUserId);
                                toast.success("Connected!");
                              }}
                              className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-tight hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => rejectFriendRequest(notif.fromUserId)}
                              className="px-5 py-2 hmo-button-ghost rounded-xl text-xs font-black uppercase tracking-tight"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer Insight */}
            <div className="p-6 border-t border-hmo-border bg-slate-50 dark:bg-white/[0.01]">
              <p className="text-[9px] text-center hmo-text-muted font-bold uppercase tracking-[0.2em] leading-relaxed">
                Stay compassionate • Stay anonymous
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

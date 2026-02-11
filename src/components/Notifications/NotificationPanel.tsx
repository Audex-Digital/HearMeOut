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
import { Bell, X, Heart, MessageCircle, UserPlus, Clock } from 'lucide-react';
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
  type: 'like' | 'comment' | 'friend_request';
  fromUserId: string;
  fromUsername: string;
  postId?: string;
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
   * Only triggers when the panel is open and the user is verified.
   * Handles sanitizing the UID to prevent whitespace issues during query matching.
   */
  useEffect(() => {
    if (!isOpen || !user?.emailVerified || user?.isAnonymous) {
      if (!isOpen) setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Sanitize UID to stay safe against copy-paste issues in Auth database
    const sanitizedUid = user.uid.trim();

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', sanitizedUid),
      orderBy('createdAt', 'desc'),
      limit(20)
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
        // Mark all fetched unread items as 'read' immediately.
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
        console.error("Notification panel error:", error);
        // Hint: Missing indexes usually throw a specific error code
        if (error.code === 'failed-precondition') {
          toast.error("Database index is being generated...");
        } else {
          toast.error("Unable to load notifications.");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isOpen, user?.uid, user?.emailVerified, user?.isAnonymous]);

  /** Formats timestamps into human-readable strings. */
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
          {/* Overlay Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          {/* Sidebar Area */}
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-hmo-card border-l border-hmo-border shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-6 border-b border-hmo-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-white">Notifications</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50 px-10 text-center">
                  <Bell size={48} className="mb-4 text-slate-600" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-2 text-slate-400 leading-relaxed">Quiet thoughts and connections will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-hmo-border">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-5 flex gap-4 transition-colors group ${!notif.read ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      {/* Interaction Type Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'like' ? 'bg-pink-500/10 text-pink-500' : 
                        notif.type === 'comment' ? 'bg-accent/10 text-accent' : 
                        'bg-primary/10 text-primary'
                      }`}>
                        {notif.type === 'like' && <Heart size={18} fill="currentColor" />}
                        {notif.type === 'comment' && <MessageCircle size={18} />}
                        {notif.type === 'friend_request' && <UserPlus size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 leading-snug">
                          <Link 
                            to={`/profile/@${notif.fromUsername}`} 
                            onClick={onClose}
                            className="text-white font-bold hover:underline"
                          >
                            {notif.fromUsername}
                          </Link>
                          {notif.type === 'like' && ' supported your post'}
                          {notif.type === 'comment' && ' replied to your post'}
                          {notif.type === 'friend_request' && ' wants to connect'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={12} className="text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        {/* Inline Social Actions */}
                        {notif.type === 'friend_request' && !notif.read && (
                          <div className="flex gap-2 mt-4">
                            <button 
                              onClick={() => acceptFriendRequest(notif.fromUserId)}
                              className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => rejectFriendRequest(notif.fromUserId)}
                              className="px-4 py-1.5 bg-white/5 border border-hmo-border text-slate-300 rounded-lg text-xs font-bold"
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
            
            <div className="p-4 border-t border-hmo-border bg-white/[0.02]">
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Stay compassionate. Stay anonymous.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

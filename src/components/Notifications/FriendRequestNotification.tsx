import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  senderUid: string;
  senderUsername: string;
}

const FriendRequestNotification: React.FC = () => {
  const { user, acceptFriendRequest, rejectFriendRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pastRequests, setPastRequests] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setPastRequests([]);
      return;
    }

    const currentRequests = user.friendRequestsReceived || [];
    
    // Find new requests that weren't in pastRequests
    const newRequests = currentRequests.filter(uid => !pastRequests.includes(uid));
    
    if (newRequests.length > 0) {
      newRequests.forEach(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const senderData = userDoc.data();
            const newNotif: Notification = {
              id: uid,
              senderUid: uid,
              senderUsername: senderData.username || 'Anonymous User'
            };
            
            setNotifications(prev => [...prev, newNotif]);
            
            // Auto-hide after 10 seconds if not acted upon
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== uid));
            }, 10000);
          }
        } catch (error) {
          console.error("Error fetching notification sender:", error);
        }
      });
    }

    setPastRequests(currentRequests);
  }, [user?.friendRequestsReceived]);

  const handleAccept = async (notif: Notification) => {
    try {
      await acceptFriendRequest(notif.senderUid);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      console.error("Failed to accept from notification:", err);
    }
  };

  const handleDecline = async (notif: Notification) => {
    try {
      await rejectFriendRequest(notif.senderUid);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      console.error("Failed to decline from notification:", err);
    }
  };

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto bg-hmo-card border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10 max-w-xs w-full backdrop-blur-xl"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-0.5">New Friend Request</h4>
                <p className="text-xs text-slate-400 truncate">
                  <span className="text-primary font-bold">{notif.senderUsername}</span> wants to connect with you.
                </p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-slate-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleAccept(notif)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Check size={14} /> Accept
              </button>
              <button 
                onClick={() => handleDecline(notif)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-hmo-border text-slate-300 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
              >
                Decline
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FriendRequestNotification;

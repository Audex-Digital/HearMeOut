/**
 * Chat.tsx
 * 
 * 1-on-1 private messaging interface.
 * Supports Evaluation Chats (Admin <-> Applicant) and Help Sessions (User <-> Listener).
 * Ensures anonymity by only showing usernames.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, 
  ChevronLeft, 
  Shield, 
  Headphones, 
  MessageSquare,
  MoreVertical,
  Flag,
  Info
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  limit,
  where
} from 'firebase/firestore';
import LoggedLayout from '../components/Layout/LoggedLayout';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

const Chat: React.FC = () => {
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const isEvaluation = searchParams.get('evaluate') === 'true';
  const isHelpSession = searchParams.get('session') === 'help';
  
  const { user, friends } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<{username: string, role: string, uid: string} | null>(null);
  const [loading, setLoading] = useState(true);

  if (!user || !uid) return null;

  // chatId generation: deterministic combination of UIDs
  const chatId = user.uid < uid ? `${user.uid}_${uid}` : `${uid}_${user.uid}`;

  // -------------------------------------------------------------
  // 1. Fetch other user's profile (for display)
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchOther = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOtherUser({ username: data.username, role: data.role, uid: docSnap.id });
        }
      } catch (err) {
        console.error("Fetch other user failed:", err);
      }
    };
    fetchOther();
  }, [uid]);

  // -------------------------------------------------------------
  // 2. CREATE OR UPDATE CHAT METADATA – only write participants once
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user || !uid) return;

    const chatRef = doc(db, 'chats', chatId);

    const initChat = async () => {
      try {
        const chatSnap = await getDoc(chatRef);
        
        if (!chatSnap.exists()) {
          // FIRST TIME: create full document including participants
          await setDoc(chatRef, {
            participants: [user.uid, uid],
            lastActivity: serverTimestamp(),
            lastMessage: null,
            type: isEvaluation ? 'evaluation' : isHelpSession ? 'help' : 'social',
            [`participantNames.${user.uid}`]: user.username,
            [`participantNames.${uid}`]: otherUser?.username || 'User'
          });
        } else {
          // SUBSEQUENT VISITS: only update allowed fields (NO participants!)
          const updateData: any = {
            lastActivity: serverTimestamp(),
            [`participantNames.${user.uid}`]: user.username,
            [`participantNames.${uid}`]: otherUser?.username || 'User'
          };
          // Only update type if it changed (optional)
          if (isEvaluation && chatSnap.data().type !== 'evaluation') {
            updateData.type = 'evaluation';
          } else if (isHelpSession && chatSnap.data().type !== 'help') {
            updateData.type = 'help';
          } else if (!isEvaluation && !isHelpSession && chatSnap.data().type !== 'social') {
            updateData.type = 'social';
          }
          await updateDoc(chatRef, updateData);
        }
      } catch (err) {
        console.error('Failed to create/update chat metadata:', err);
        toast.error('Could not initialize chat. Please try again.');
      }
    };

    initChat();
  }, [user, uid, chatId, isEvaluation, isHelpSession, otherUser?.username]);

  // -------------------------------------------------------------
  // 3. REAL‑TIME MESSAGES – only start AFTER chat doc exists
  // -------------------------------------------------------------
  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        // Reverse to show oldest at top, newest at bottom
        setMessages(msgs.reverse());
        setLoading(false);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        console.error('Messages snapshot error:', error);
        if (error.code === 'permission-denied') {
          toast.error('You do not have access to this conversation.');
          navigate('/chats');
        } else {
          toast.error('Failed to load messages.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, navigate]);

  // -------------------------------------------------------------
  // 4. SEND MESSAGE
  //    - Adds the message document
  //    - Updates chat metadata (lastActivity, lastMessage)
  // -------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    try {
      // 1. Add the actual message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: text,
        createdAt: serverTimestamp(),
        type: 'text'
      });

      // 2. Update chat metadata (last message preview, timestamp)
      await updateDoc(doc(db, 'chats', chatId), {
        lastActivity: serverTimestamp(),
        lastMessage: text.length > 50 ? text.substring(0, 47) + "..." : text
      });

      // 3. Trigger a notification for the recipient
      await addDoc(collection(db, 'notifications'), {
        recipientId: uid,
        fromUserId: user.uid,
        fromUsername: user.username,
        type: 'chat_message',
        text: text.length > 30 ? text.substring(0, 27) + "..." : text,
        createdAt: serverTimestamp(),
        read: false
      });

    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Message not sent.");
    }
  };

  const handleReport = () => {
    toast("Reporting feature coming soon. Please contact admins for immediate assistance.", { icon: '🛡️' });
  };

  /** 
   * SOCIAL GUARD & NOTIFICATION SUPPRESSION
   */
  const isFriend = friends.includes(uid);
  // Special sessions (Help/Eval) might have different social rules, but as requested, 
  // we ensure the logic is available for both.
  const canChat = isEvaluation || isHelpSession || isFriend;

  // AUTO-SUPPRESS NOTIFICATIONS FOR OPEN CHAT
  // If a notification arrives for THIS specific conversation while we are looking at it,
  // mark it as read immediately to prevent redundant toasts.
  useEffect(() => {
    if (!user || !uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('fromUserId', '==', uid),
      where('type', '==', 'chat_message'),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((nDoc) => {
        updateDoc(doc(db, 'notifications', nDoc.id), { read: true });
      });
    });

    return () => unsubscribe();
  }, [user.uid, uid]);

  return (
    <LoggedLayout>
      <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-hmo-card border border-hmo-border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Chat Header */}
        <div className="px-6 py-5 bg-white/[0.02] border-b border-hmo-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-hmo-border">
                {otherUser?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-hmo-card rounded-full" />
            </div>
            <div>
              <p className="text-sm font-black text-white">@{otherUser?.username || 'Loading...'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isEvaluation ? (
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                    <Info size={10} /> Evaluation Session
                  </span>
                ) : isHelpSession ? (
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Headphones size={10} /> Active Support
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Encrypted Chat</span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 text-slate-600 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Syncing Feed...</p>
             </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center text-primary/30 mb-4">
                <MessageSquare size={32} />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Safe Space Established</p>
              <p className="text-slate-600 text-[10px] leading-relaxed max-w-[200px] italic">
                {isEvaluation 
                  ? "Admins: Please use this space to evaluate the listener applicant's suitability." 
                  : "Every word shared here is protected by our peer support guidelines."}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user.uid;
              return (
                <motion.div 
                  key={msg.id || idx}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    isMine 
                    ? 'bg-primary text-white font-medium rounded-tr-none shadow-lg shadow-primary/10' 
                    : 'bg-white/5 border border-hmo-border text-slate-200 rounded-tl-none font-medium'
                  }`}>
                    {msg.text}
                    <div className={`text-[8px] mt-1.5 uppercase font-black tracking-tighter ${isMine ? 'text-white/40' : 'text-slate-600'}`}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/[0.02] border-t border-hmo-border relative">
          {canChat ? (
            <form onSubmit={handleSendMessage} className="flex gap-3 relative group">
              <input 
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#05070a] border border-hmo-border rounded-2xl pl-6 pr-14 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <div className="py-4 px-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
              <p className="text-red-400/70 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                You are no longer friends with this user.<br/>
                <span className="text-slate-500">Add them again to continue chatting.</span>
              </p>
              <button 
                onClick={() => navigate(`/profile/@${otherUser?.username}`)}
                className="mt-2 text-primary text-[10px] font-black uppercase tracking-tighter hover:underline"
              >
                Go to profile →
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-3 px-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Shield size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">Peer-to-Peer Encrypted</span>
            </div>
            <button 
              onClick={handleReport}
              className="flex items-center gap-1.5 text-slate-600 hover:text-red-500 transition-colors"
            >
              <Flag size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">Report Chat</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Guard Overlay */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      </div>
    </LoggedLayout>
  );
};

export default Chat;
/**
 * ChatList.tsx
 * 
 * Displays all active 1-on-1 conversations for the current user.
 * Fetches data from the 'chats' collection where the user's UID is in the participants array.
 * Integrates real-time updates for last messages and activity timestamps.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Clock, 
  ChevronRight,
  Headphones,
  Shield
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import LoggedLayout from '../components/Layout/LoggedLayout';

interface ChatMetadata {
  id: string;
  participants: string[];
  lastActivity: any;
  lastMessage: string;
  type: 'social' | 'help' | 'evaluation';
  participantNames?: Record<string, string>;
}

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats: ChatMetadata[] = [];
      snapshot.forEach((doc) => {
        fetchedChats.push({ id: doc.id, ...doc.data() } as ChatMetadata);
      });
      setChats(fetchedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredChats = chats.filter(chat => {
    const otherUid = chat.participants.find(p => p !== user?.uid);
    const otherName = chat.participantNames?.[otherUid || ''] || 'Unknown User';
    return otherName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <LoggedLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black hmo-text-primary mb-2 tracking-tighter flex items-center gap-3">
              <MessageSquare size={32} className="text-primary" />
              Incoming Messages
            </h1>
            <p className="hmo-text-secondary font-medium italic">Your private encrypted conversations.</p>
          </div>
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 border border-hmo-border rounded-2xl flex items-center gap-3">
            <Shield size={16} className="text-primary" />
            <span className="text-[10px] font-black hmo-text-muted uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative group mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 hmo-card border border-hmo-border rounded-[1.5rem] hmo-text-primary placeholder:hmo-text-muted focus:outline-none focus:border-primary/50 transition-all shadow-inner"
          />
        </div>

        {/* Chat List Feed */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 hmo-card border border-hmo-border rounded-[2rem] animate-pulse shadow-sm" />
            ))
          ) : filteredChats.length === 0 ? (
            <div className="py-20 text-center hmo-card border border-hmo-border rounded-[2.5rem] border-dashed">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 hmo-text-muted opacity-30">
                <MessageSquare size={32} />
              </div>
              <p className="hmo-text-muted font-bold uppercase tracking-widest text-xs">No active conversations found.</p>
              <button 
                onClick={() => navigate('/feed')}
                className="mt-6 text-primary text-xs font-black uppercase tracking-tighter hover:underline"
              >
                Find someone to talk to →
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUid = chat.participants.find(p => p !== user?.uid);
              const otherName = chat.participantNames?.[otherUid || ''] || 'Participant';
              const isSupport = chat.type === 'help';
              const isEvaluation = chat.type === 'evaluation';

              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/chat/${otherUid}${chat.type === 'evaluation' ? '?evaluate=true' : chat.type === 'help' ? '?session=help' : ''}`)}
                  className="hmo-card border border-hmo-border p-6 rounded-[2rem] cursor-pointer hover:border-primary/30 transition-all flex items-center gap-5 group shadow-xl dark:shadow-none"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black hmo-text-muted text-xl border border-hmo-border shadow-inner group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                      {otherName[0]?.toUpperCase()}
                    </div>
                    {isSupport && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg">
                        <Headphones size={12} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="hmo-text-primary font-black text-base">@{otherName}</span>
                        {isEvaluation && (
                          <span className="text-[8px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Eval</span>
                        )}
                        {isSupport && (
                          <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Support</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] hmo-text-muted font-bold uppercase tracking-tighter">
                        <Clock size={10} />
                        {chat.lastActivity?.toDate ? chat.lastActivity.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    <p className="hmo-text-secondary text-sm line-clamp-1 italic font-medium leading-relaxed">
                      {chat.lastMessage || "Click to start the conversation..."}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="text-slate-700 group-hover:text-primary transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-12 p-6 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center gap-4">
          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-primary">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="hmo-text-primary font-black uppercase tracking-tighter text-sm mb-0.5">Safe Space Shield</h4>
            <p className="hmo-text-secondary text-xs font-medium leading-relaxed">
              Conversations are private and encrypted. Staff will only review chats if a <span className="text-red-500/70 font-bold">formal report</span> is filed for your safety.
            </p>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default ChatList;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, Check, ShieldAlert, Clock } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';

interface Post {
  id: string;
  username: string;
  authorId: string;
  content: string;
  createdAt: any;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, sendFriendRequest, cancelFriendRequest } = useAuth();
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: Post[] = [];
      snapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendRequest = async (targetUid: string) => {
    setRequesting(targetUid);
    try {
      await sendFriendRequest(targetUid);
    } catch (err) {
      console.error("Failed to send request:", err);
    } finally {
      setRequesting(null);
    }
  };

  const handleCancelRequest = async (targetUid: string) => {
    setRequesting(targetUid);
    try {
      await cancelFriendRequest(targetUid);
    } catch (err) {
      console.error("Failed to cancel request:", err);
    } finally {
      setRequesting(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Admin: Permanently delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

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
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-2xl">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Community Feed</h1>
            <p className="text-slate-400 text-sm">Quiet thoughts from a safe community.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <ShieldAlert size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin View</span>
            </div>
          )}
        </header>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => {
              const isFriend = user?.friends?.includes(post.authorId);
              const requestSent = user?.friendRequestsSent?.includes(post.authorId);
              const isSelf = user?.uid === post.authorId;

              return (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-hmo-card border border-hmo-border rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-700 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {post.username?.[0] || 'A'}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{post.username || 'Anonymous'}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{getRelativeTime(post.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       {!isSelf && !isFriend && (
                        requestSent ? (
                          <div className="relative group/tooltip">
                            <button 
                              onClick={() => handleCancelRequest(post.authorId)}
                              disabled={requesting === post.authorId}
                              className="p-2 text-primary bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500"
                              title="Cancel Request"
                            >
                              <Clock size={18} className="animate-pulse-slow" />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-hmo-border">
                              Friend request sent
                            </span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSendRequest(post.authorId)}
                            disabled={requesting === post.authorId}
                            className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Add Friend"
                          >
                            <UserPlus size={18} />
                          </button>
                        )
                       )}
                       {isFriend && (
                         <span className="p-2 text-green-500 bg-green-500/10 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase">
                           <Check size={14} /> Friend
                         </span>
                       )}
                       {isAdmin && (
                         <button 
                           onClick={() => handleDeletePost(post.id)}
                           className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                           title="Delete Post"
                         >
                           <MoreHorizontal size={18} />
                         </button>
                       )}
                    </div>
                  </div>
                  
                  <p className="text-slate-300 leading-relaxed mb-6 text-sm">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-6 pt-4 border-t border-hmo-border">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-medium">
                      <Heart size={16} />
                      Support
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-xs font-medium">
                      <MessageCircle size={16} />
                      Reply
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium ml-auto">
                      <Share2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 px-6 bg-hmo-card border border-dashed border-hmo-border rounded-3xl">
              <p className="text-slate-400 text-lg italic">“No posts yet. You’re not alone. Start sharing when ready.”</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;

/**
 * PostCard.tsx
 * 
 * Individual feed item component that displays post content, author details,
 * support (like) counts, and reply counts. Includes atomic transaction logic
 * for liking/unliking to ensure consistency with the Firestore database.
 * 
 * Dependencies:
 * - Lucide React (Icons)
 * - Framer Motion (Animations)
 * - React Hot Toast (Feedback)
 * - Firebase Firestore (Transactions, increment)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, Check, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase/config';
import { 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  collection, 
  addDoc,
  getDoc,
  runTransaction,
  increment
} from 'firebase/firestore';

/**
 * Interface representing the core post document structure.
 */
interface Post {
  id: string;
  username: string;
  authorId: string;
  content: string;
  createdAt: any;
  likes?: number;
  commentCount?: number;
}

/**
 * Props passed to the PostCard component.
 */
interface PostCardProps {
  post: Post;
  /** Whether the current viewer has admin privileges. */
  isAdmin?: boolean;
  /** Callback to trigger post deletion (admin only). */
  onDelete?: (id: string) => void;
  /** Callback to initiate a friend request. */
  onSendFriendRequest?: (id: string) => void;
  /** Callback to cancel a pending friend request. */
  onCancelFriendRequest?: (id: string) => void;
  /** Global loading state for friend operations. */
  requesting?: boolean;
  /** Triggers the global comments modal. */
  onOpenComments: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  isAdmin, 
  onDelete, 
  onSendFriendRequest, 
  onCancelFriendRequest,
  requesting,
  onOpenComments
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  /**
   * Syncs the local likes count with the post.likes prop when it changes.
   * This ensures the component reacts to other users liking the same post.
   */
  useEffect(() => {
    setLikesCount(post.likes || 0);
  }, [post.likes]);

  /**
   * Listen for whether the current user has personally liked this post.
   * Checks the '/posts/{id}/likes/{uid}' subcollection.
   */
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }
    
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const unsubscribe = onSnapshot(likeRef, {
      next: (doc) => {
        setIsLiked(doc.exists());
      },
      error: (error) => {
        console.error("Like sync error:", error);
        toast.error("Connectivity issue for support count.");
      }
    });

    return () => unsubscribe();
  }, [post.id, user?.uid, user?.emailVerified]);

  /**
   * Atomically toggles the 'like' status.
   * Logic: 
   * 1. Performs an optimistic UI update.
   * 2. Runs a Firestore transaction to increment/decrement the count 
   *    and create/delete the user's specific like document.
   * 3. Sends a notification to the author if successful.
   */
  const handleToggleLike = async () => {
    if (!user || likeLoading) return;
    
    // Support feature is reserved for verified non-guests
    if (!user.emailVerified || user.isAnonymous) {
      toast.error("Please verify your email to support others.");
      return;
    }
    
    setLikeLoading(true);
    
    const postRef = doc(db, 'posts', post.id);
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const wasLiked = isLiked;
    
    // --- OPTIMISTIC UPDATE ---
    // Change UI state immediately for responsive feel
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const alreadyLiked = likeDoc.exists();

        // Safety: Ensure server state matches our toggle direction
        if (alreadyLiked) {
          transaction.delete(likeRef);
          transaction.update(postRef, { 
            likes: increment(-1) 
          });
        } else {
          transaction.set(likeRef, {
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          transaction.update(postRef, { 
            likes: increment(1) 
          });
        }
      });

      // Notify owner if someone else supports their post
      if (!wasLiked && user.uid !== post.authorId) {
        addDoc(collection(db, 'notifications'), {
          recipientId: post.authorId,
          fromUserId: user.uid,
          fromUsername: user.username,
          type: 'like',
          postId: post.id,
          createdAt: serverTimestamp(),
          read: false
        }).catch(err => console.error("Notification failed:", err));
      }

    } catch (error) {
      console.error("Support update failed:", error);
      toast.error("Failed to sync support.");
      // Rollback optimistic state if the network dies
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

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

  // Helper variables for friend request UI
  const isFriend = user?.friends?.includes(post.authorId);
  const requestSent = user?.friendRequestsSent?.includes(post.authorId);
  const isSelf = user?.uid === post.authorId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-hmo-card border border-hmo-border rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-700 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <Link to={`/profile/@${post.username}`} className="flex items-center gap-3 group/author">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs group-hover/author:scale-110 transition-transform">
            {post.username?.[0] || 'A'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover/author:underline">{post.username || 'Anonymous'}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{getRelativeTime(post.createdAt)}</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
           {/* Friend Request Logic */}
           {!isSelf && !isFriend && (
            requestSent ? (
              <div className="relative group/tooltip">
                <button 
                  onClick={() => onCancelFriendRequest?.(post.authorId)}
                  disabled={requesting}
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
                onClick={() => onSendFriendRequest?.(post.authorId)}
                disabled={requesting}
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
           {/* Admin Controls */}
           {isAdmin && onDelete && (
             <button 
               onClick={() => onDelete(post.id)}
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

      {/* Action Bar */}
      <div className="flex items-center gap-6 pt-4 border-t border-hmo-border">
        {/* Support Button (Like) */}
        <button 
          onClick={handleToggleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 transition-colors text-xs font-medium ${isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-primary'}`}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          {isLiked ? 'Supported' : 'Support'}
          {likesCount > 0 ? (
             <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-bold">
               {likesCount}
             </span>
          ) : null}
        </button>

        {/* Reply Button (Comments) */}
        <button 
          onClick={() => onOpenComments(post)}
          className="flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-xs font-medium relative"
        >
          <MessageCircle size={16} />
          Reply
          {post.commentCount && post.commentCount > 0 ? (
            <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 bg-accent text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {post.commentCount}
            </span>
          ) : null}
        </button>

        <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium ml-auto">
          <Share2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;

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
import { Heart, MessageCircle, UserPlus, Clock, ShieldAlert, MessageSquare } from 'lucide-react';
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
  runTransaction,
  increment,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import PostOptions from './PostOptions';

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
  const [isSaved, setIsSaved] = useState(false);
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
   * Listen for whether the current user has bookmarked this post.
   */
  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }
    
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', post.id);
    const unsubscribe = onSnapshot(bookmarkRef, (docSnap) => {
      setIsSaved(docSnap.exists());
    }, (error) => {
      console.error("Bookmark sync error:", error);
    });

    return () => unsubscribe();
  }, [post.id, user?.uid]);

  /**
   * Atomically toggles the 'like' status.
   */
  const handleToggleLike = async () => {
    if (!user || likeLoading) return;
    
    if (!user.emailVerified || user.isAnonymous) {
      toast.error("Please verify your email to support others.");
      return;
    }
    
    setLikeLoading(true);
    const postRef = doc(db, 'posts', post.id);
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const wasLiked = isLiked;
    
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) {
          transaction.delete(likeRef);
          transaction.update(postRef, { likes: increment(-1) });
        } else {
          transaction.set(likeRef, { userId: user.uid, createdAt: serverTimestamp() });
          transaction.update(postRef, { likes: increment(1) });
        }
      });

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
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  /**
   * Atomically toggles the 'save/bookmark' status.
   */
  const handleToggleSave = async () => {
    if (!user) return;
    
    if (!user.emailVerified || user.isAnonymous) {
      toast.error("Please verify your email to save posts.");
      return;
    }

    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', post.id);
    try {
      if (isSaved) {
        await deleteDoc(bookmarkRef);
        toast.success("Removed from bookmarks");
      } else {
        await setDoc(bookmarkRef, {
          postId: post.id,
          savedAt: serverTimestamp()
        });
        toast.success("Post saved to bookmarks!", { icon: '🔖' });
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
      toast.error("Failed to update bookmark.");
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

  const { friends, outgoingRequests } = useAuth();
  const isFriend = friends.includes(post.authorId);
  const requestSent = outgoingRequests.some(req => req.to === post.authorId);
  const isSelf = user?.uid === post.authorId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hmo-card p-6 sm:p-8 mb-6 dark:hover:border-slate-700 shadow-xl dark:shadow-none"
    >
      <div className="flex justify-between items-start mb-6">
        <Link to={`/profile/@${post.username}`} className="flex items-center gap-4 group/author">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-black text-sm group-hover/author:scale-105 transition-transform shadow-inner">
            {post.username?.slice(0, 2).toUpperCase() || 'AN'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold hmo-text-primary group-hover/author:text-primary transition-colors">{post.username || 'Anonymous'}</h3>
              {isAdmin && (
                <ShieldAlert size={14} className="text-primary" aria-label="Administrator" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <Clock size={12} className="hmo-text-muted" />
               <p className="text-[11px] font-bold hmo-text-muted uppercase tracking-wider">{getRelativeTime(post.createdAt)}</p>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
            <PostOptions 
              postId={post.id}
              postAuthorId={post.authorId}
              userId={user?.uid || ''}
              userRole={user?.role === 'admin' ? 'admin' : 'user'}
              isSaved={isSaved}
              onDelete={(id) => onDelete?.(id)}
              onSave={handleToggleSave}
              onReport={() => toast.success("Thank you. Our moderators will review this post.", { icon: '🛡️' })}
            />
        </div>
      </div>
      
       <p className="hmo-text-secondary leading-relaxed mb-8 text-[15px] font-medium">
         {post.content}
       </p>

      {/* Action Bar */}
      <div className="flex items-center gap-8 pt-6 border-t border-hmo-border/50">
        <button 
          onClick={handleToggleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2.5 transition-all text-sm font-bold active:scale-95 ${isLiked ? 'text-primary' : 'hmo-text-secondary hover:hmo-text-primary'}`}
       >
         <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-heartbeat" : ""} />
         <span className="hidden sm:inline">Support</span>
         {likesCount > 0 && <span className="text-[10px] bg-slate-100 dark:bg-white/5 hmo-text-primary px-2 py-0.5 rounded-full font-bold">{likesCount}</span>}
        </button>

        <button 
          onClick={() => onOpenComments(post)}
          className="flex items-center gap-2.5 hmo-text-secondary hover:hmo-text-primary transition-all text-sm font-bold active:scale-95"
       >
         <MessageCircle size={18} />
         <span className="hidden sm:inline">Reply</span>
         {post.commentCount && post.commentCount > 0 && <span className="text-[10px] bg-slate-100 dark:bg-white/5 hmo-text-primary px-2 py-0.5 rounded-full font-bold">{post.commentCount}</span>}
        </button>

        {!isSelf && !isFriend && (
          <button 
            onClick={() => requestSent ? onCancelFriendRequest?.(post.authorId) : onSendFriendRequest?.(post.authorId)}
            disabled={requesting}
             className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${requestSent ? 'bg-primary/10 text-primary' : 'hmo-button-ghost'}`}
           >
             {requestSent ? <Clock size={14} /> : <UserPlus size={14} />}
             {requestSent ? 'Pending' : 'Add Friend'}
          </button>
        )}

        {isFriend && (
          <Link 
            to={`/chat/${post.authorId}`}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all active:scale-95 shadow-sm shadow-primary/5"
          >
            <MessageSquare size={14} />
            Chat
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default PostCard;

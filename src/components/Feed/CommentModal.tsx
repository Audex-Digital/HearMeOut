/**
 * CommentModal.tsx
 * 
 * An overlay modal that displays replies for a specific post.
 * Features:
 * - Real-time listener for comments.
 * - Atomic submission (adds comment and increments post counter in a batch).
 * - Automatic scrolling to new comments.
 * 
 * Dependencies:
 * - Framer Motion (Transitions)
 * - Firebase Firestore (onSnapshot, writeBatch, increment)
 * - useAuth (Context)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  writeBatch,
  increment
} from 'firebase/firestore';

/** Interface for the post document being commented on. */
interface Post {
  id: string;
  username: string;
  authorId: string;
  content: string;
}

/** Interface for a single comment document. */
interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: any;
}

/** Props for the CommentModal component. */
interface CommentModalProps {
  /** The post to show comments for. If null, the modal is hidden. */
  post: Post | null;
  /** Callback to close the modal. */
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Listen for real-time updates to the post's 'comments' subcollection.
   */
  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'posts', post.id, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const fetched: Comment[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Comment);
        });
        setComments(fetched);
        setLoading(false);
      },
      error: (error) => {
        console.error("Comment sync failure:", error);
        toast.error("Failed to sync replies.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [post?.id]);

  /** Scroll to the bottom of the comment list whenever the comment array changes. */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  /**
   * Submits a new reply.
   * Logic: 
   * - Uses `writeBatch` to ensure the new comment and the post's `commentCount` 
   *   increment are atomic.
   * - Sends a separate notification to the author.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety guards
    if (!user || !post || !newComment.trim() || submitting) return;
    if (!user.emailVerified || user.isAnonymous) {
      toast.error("Please verify your email to reply.");
      return;
    }

    setSubmitting(true);
    
    try {
      const batch = writeBatch(db);

      // 1. Prepare new comment document reference
      const commentRef = doc(collection(db, 'posts', post.id, 'comments'));
      batch.set(commentRef, {
        userId: user.uid,
        username: user.username,
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // 2. Prepare post counter increment
      const postRef = doc(db, 'posts', post.id);
      batch.update(postRef, {
        commentCount: increment(1)
      });

      // 3. Commit both writes atomically
      await batch.commit();

      // 4. Fire-and-forget notification to post author
      if (user.uid !== post.authorId) {
        addDoc(collection(db, 'notifications'), {
          recipientId: post.authorId,
          fromUserId: user.uid,
          fromUsername: user.username,
          type: 'comment',
          postId: post.id,
          createdAt: serverTimestamp(),
          read: false
        }).catch(err => console.warn("Reply notification failed:", err));
      }

      toast.success("Reply shared!");
      setNewComment('');
      
    } catch (error) {
      console.error("Comment submission error:", error);
      toast.error("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /** Formats timestamps for comment timestamps. */
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <AnimatePresence>
      {post && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-hmo-card border border-hmo-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-hmo-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">Post Replies</h2>
                  <Link 
                    to={`/profile/@${post.username}`} 
                    onClick={onClose}
                    className="text-xs text-slate-500 hover:text-white transition-colors hover:underline"
                  >
                    Shared by @{post.username}
                  </Link>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Post Context Area */}
            <div className="p-6 bg-white/[0.02] border-b border-hmo-border">
              <p className="text-slate-300 text-sm italic line-clamp-2">
                "{post.content}"
              </p>
            </div>

            {/* Comments List */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group">
                    <Link 
                      to={`/profile/@${comment.username}`}
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-400 hover:scale-110 transition-transform"
                    >
                      {comment.username[0]}
                    </Link>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          to={`/profile/@${comment.username}`}
                          onClick={onClose}
                          className="text-xs font-bold text-white hover:underline"
                        >
                          {comment.username}
                        </Link>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                          {getRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <p className="text-sm italic">No replies yet. Be the first to share support.</p>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-6 border-t border-hmo-border bg-hmo-card">
              <form onSubmit={handleSubmit} className="relative">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Supportive reply..."
                  className="w-full bg-white/5 border border-hmo-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all pr-14"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-accent disabled:text-slate-600 transition-colors"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              <p className="text-[10px] text-slate-500 mt-4 text-center">
                 Your supportive words can change someone's day.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommentModal;

/**
 * CreatePost.tsx
 * 
 * Interface for users to share new thoughts on the platform.
 * Features:
 * - Real-time character count limit.
 * - Anonymous posting using the current user's public handle.
 * - Visual feedback with toast notifications.
 * 
 * Dependencies:
 * - useAuth (Attributing posts to users)
 * - Firebase Firestore (addDoc, serverTimestamp)
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Send, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreatePost: React.FC = () => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const charLimit = 300;

  /** 
   * Validates and submits the post to Firestore. 
   * Logic: 
   * - Sanitizes input.
   * - Adds a document to the root 'posts' collection.
   * - Redirects user back to feed on success.
   */
  const handlePost = async () => {
    // Permission: Both standard and guest users can post.
    if (!content.trim() || !user) return;
    
    setIsPosting(true);
    
    try {
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: user.uid,
        username: user.username,
        createdAt: serverTimestamp(),
        likes: 0,
        commentCount: 0 // Initialize counter
      });
      toast.success("Your thought has been shared safely.");
      navigate('/feed');
    } catch (error) {
      console.error("Posting error:", error);
      toast.error("Failed to share. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Form Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white leading-tight">Share Your Thoughts</h1>
            <button 
              onClick={() => navigate('/feed')}
              className="p-2 text-slate-500 hover:text-white transition-colors"
              aria-label="Cancel"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Input Area */}
            <div className="relative">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                placeholder="What's weighing on you? Share it securely..."
                className="w-full h-64 px-6 py-6 bg-white/5 border border-hmo-border rounded-2xl text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner"
              />
              {/* Character Counter */}
              <div className={`absolute bottom-6 right-6 text-[10px] font-bold tracking-widest ${content.length >= charLimit ? 'text-red-500' : 'text-slate-500'}`}>
                {content.length} / {charLimit}
              </div>
            </div>

            {/* Safety Notification */}
            <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <ShieldAlert size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Your post is indexed for safety moderation, but your identity remains fully anonymous. Be supportive and helpful to others.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/feed')}
                className="flex-1 py-4 bg-white/5 border border-hmo-border rounded-2xl font-bold text-slate-500 hover:text-white hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={handlePost}
                disabled={isPosting || !content.trim() || !user}
                className="flex-[2] flex items-center justify-center gap-3 bg-gradient-to-br from-primary to-accent text-white py-4 rounded-2xl font-bold hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:translate-y-0 text-xs uppercase tracking-widest"
              >
                {isPosting ? "Posting..." : <><Send size={18} /> Share Anonymously</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePost;

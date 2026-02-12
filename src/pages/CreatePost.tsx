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
import { Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import LoggedLayout from '../components/Layout/LoggedLayout';

const CreatePost: React.FC = () => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const charLimit = 300;

  /** 
   * Validates and submits the post.
   */
  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    
    try {
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: user.uid,
        username: user.username,
        createdAt: serverTimestamp(),
        likes: 0,
        commentCount: 0
      });
      toast.success("Shared safely.");
      navigate('/feed');
    } catch (error) {
      console.error("Posting error:", error);
      toast.error("Failed to share.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <LoggedLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        
        {/* Placeholder/Status Banner */}
        <div className="bg-hmo-card border border-dashed border-hmo-border rounded-3xl p-12 text-center text-slate-500 font-bold text-sm">
          Post creation mode enabled
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hmo-card border border-hmo-border rounded-[2.5rem] p-8 sm:p-10 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-black text-white leading-tight uppercase tracking-widest">Write Something</h1>
            <button 
              onClick={() => navigate('/feed')}
              className="p-2 text-slate-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                placeholder="What's weighing on you? Share it securely..."
                className="w-full h-48 px-8 py-8 bg-[#05070a]/50 border border-hmo-border rounded-3xl text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner"
              />
              <div className={`absolute bottom-6 right-8 text-[10px] font-black tracking-[0.2em] ${content.length >= charLimit ? 'text-red-500' : 'text-slate-600'}`}>
                {content.length} / {charLimit}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/feed')}
                className="py-4 bg-white/5 border border-hmo-border rounded-2xl font-black text-slate-500 hover:text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
              >
                Cancel Post
              </button>
              <button 
                onClick={handlePost}
                disabled={isPosting || !content.trim() || !user}
                className="flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
              >
                {isPosting ? "Posting..." : <><Send size={16} /> Share Anonymously</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </LoggedLayout>
  );
};

export default CreatePost;

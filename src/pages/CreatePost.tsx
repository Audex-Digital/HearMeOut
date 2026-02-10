import React, { useState } from 'react';
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

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    
    try {
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: user.uid,
        username: user.username,
        createdAt: serverTimestamp(),
        likes: 0
      });
      navigate('/feed');
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">Create a Post</h1>
            <button 
              onClick={() => navigate('/feed')}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                placeholder="What's on your mind? Share it anonymously..."
                className="w-full h-64 px-6 py-6 bg-white/5 border border-hmo-border rounded-2xl text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner"
              />
              <div className={`absolute bottom-6 right-6 text-xs font-bold ${content.length >= charLimit ? 'text-red-500' : 'text-slate-500'}`}>
                {content.length} / {charLimit}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <ShieldAlert size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Your post is linked internally to your account for safety, but will only be displayed with your anonymous username. Keep it respectful and supportive.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/feed')}
                className="flex-1 py-4 bg-white/5 border border-hmo-border rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePost}
                disabled={isPosting || !content.trim()}
                className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-accent text-white py-4 rounded-2xl font-bold hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary-glow transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isPosting ? "Posting..." : <><Send size={18} /> Post Anonymously</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePost;

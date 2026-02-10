import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}

const Feed: React.FC = () => {
  const posts: Post[] = [
    {
      id: '1',
      username: 'SilentOcean',
      content: 'Sometimes I just need to sit in silence and realize that I am doing my best. Just wanted to share this with anyone feeling overwhelmed today.',
      timestamp: '2h ago'
    },
    {
      id: '2',
      username: 'MountainBreeze',
      content: 'Found out that walking even for 10 minutes helps me clear my head. Small victories matter.',
      timestamp: '5h ago'
    },
    {
      id: '3',
      username: 'MidnightEcho',
      content: 'I wish there was a way to explain how I feel without using words. But being here helps.',
      timestamp: '1d ago'
    }
  ];

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-2xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Community Feed</h1>
          <p className="text-slate-400 text-sm">Quiet thoughts from a safe community.</p>
        </header>

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-hmo-card border border-hmo-border rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {post.username[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{post.username}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{post.timestamp}</p>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                
                <p className="text-slate-300 leading-relaxed mb-6">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-4 border-t border-hmo-border">
                  <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-medium">
                    <Heart size={18} />
                    Support
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-sm font-medium">
                    <MessageCircle size={18} />
                    Reply
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium ml-auto">
                    <Share2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 px-6 bg-hmo-card border border-dashed border-hmo-border rounded-3xl">
              <p className="text-slate-400 text-lg">“No posts yet. You’re not alone. Start sharing when ready.”</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;

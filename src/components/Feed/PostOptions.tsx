import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, 
  Trash2, 
  Bookmark, 
  Flag
} from 'lucide-react';

interface PostOptionsProps {
  postId: string;
  postAuthorId: string;
  userId: string;
  userRole: 'admin' | 'user';
  isSaved?: boolean;
  onDelete: (postId: string) => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
}

const PostOptions: React.FC<PostOptionsProps> = ({
  postId,
  postAuthorId,
  userId,
  userRole,
  isSaved = false,
  onDelete,
  onSave,
  onReport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = userId === postAuthorId;
  const isAdmin = userRole === 'admin';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleAction = (callback: (id: string) => void) => {
    callback(postId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90"
        aria-label="Post options"
      >
        <MoreHorizontal size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-48 bg-hmo-card border border-hmo-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
          >
            <div className="py-2">
              {/* Save Option - Available to everyone */}
              <button
                onClick={() => handleAction(onSave)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-sm font-bold text-left ${
                  isSaved ? 'text-primary bg-primary/5' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-primary" : "text-primary"} />
                {isSaved ? 'Saved to Bookmarks' : 'Save Post'}
              </button>

              {/* Delete Option - Owner or Admin only */}
              {(isOwner || isAdmin) && (
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-bold text-left border-t border-hmo-border"
                >
                  <Trash2 size={16} />
                  Delete Post
                </button>
              )}

              {/* Report Option - Others only */}
              {!isOwner && !isAdmin && (
                <button
                  onClick={() => handleAction(onReport)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-slate-400 hover:bg-white/5 hover:text-red-500/80 hover:text-red-400 transition-colors text-sm font-bold text-left border-t border-hmo-border"
                >
                  <Flag size={16} />
                  Report Post
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostOptions;

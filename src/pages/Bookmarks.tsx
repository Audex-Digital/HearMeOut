/**
 * Bookmarks.tsx
 * 
 * Displays all posts that the user has saved.
 * Features:
 * - Real-time listener for the user's 'bookmarks' subcollection.
 * - Fetches corresponding post data for each bookmark.
 * - Same interactive capability as the main feed via PostCard.
 */

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import PostCard from '../components/Feed/PostCard';
import CommentModal from '../components/Feed/CommentModal';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { alertService } from '../utils/sweetalert';
import { deleteDoc } from 'firebase/firestore';
import LoggedLayout from '../components/Layout/LoggedLayout';

interface Post {
  id: string;
  username: string;
  authorId: string;
  content: string;
  createdAt: any;
  likes?: number;
  commentCount?: number;
}

const Bookmarks: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const { user, isAdmin, sendFriendRequest, cancelFriendRequest } = useAuth();
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const q = query(bookmarksRef, orderBy('savedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postIds = snapshot.docs.map(doc => doc.id);
      
      if (postIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch all post documents
      // Note: For large amounts of bookmarks, this could be optimized
      try {
        const postPromises = postIds.map(id => getDoc(doc(db, 'posts', id)));
        const postSnaps = await Promise.all(postPromises);
        
        const fetchedPosts: Post[] = [];
        postSnaps.forEach(snap => {
          if (snap.exists()) {
            fetchedPosts.push({ id: snap.id, ...snap.data() } as Post);
          }
        });
        
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to fetch bookmarked posts:", err);
        toast.error("Could not load some bookmarks.");
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Bookmarks listener error:", error);
      toast.error("Failed to sync bookmarks.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendRequest = async (targetUid: string) => {
    if (!user?.emailVerified || user?.isAnonymous) return;
    setRequestingId(targetUid);
    try {
      await sendFriendRequest(targetUid);
    } finally {
      setRequestingId(null);
    }
  };

  const handleCancelRequest = async (targetUid: string) => {
    if (!user?.emailVerified || user?.isAnonymous) return;
    setRequestingId(targetUid);
    try {
      await cancelFriendRequest(targetUid);
    } finally {
      setRequestingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete || !user) return;

    const isOwner = user.uid === postToDelete.authorId;
    
    if (!isAdmin && !isOwner) {
      toast.error("Permission denied.");
      return;
    }

    const confirmed = await alertService.delete('this community post');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success("Post removed.");
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Failed to remove post.");
    }
  };

  return (
    <LoggedLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-4 px-6 py-5 bg-white/[0.02] border border-hmo-border rounded-[2.5rem]">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Bookmark size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Your Saved Posts</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Quiet reflections you've held onto.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Gathering Bookmarks...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                onDelete={handleDeletePost}
                onSendFriendRequest={handleSendRequest}
                onCancelFriendRequest={handleCancelRequest}
                requesting={requestingId === post.authorId}
                onOpenComments={(p) => setActivePostForComments(p)}
              />
            ))
          ) : (
            <div className="text-center py-24 px-8 bg-hmo-card border border-dashed border-hmo-border rounded-[2.5rem] flex flex-col items-center">
              <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center text-slate-700 mb-6">
                 <Bookmark size={32} />
              </div>
              <h3 className="text-white font-bold mb-2">No bookmarks found</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed italic">
                Save posts that resonate with you to find them easily later.
              </p>
            </div>
          )}
        </div>
      </div>

      <CommentModal 
        post={activePostForComments} 
        onClose={() => setActivePostForComments(null)} 
      />
    </LoggedLayout>
  );
};

export default Bookmarks;

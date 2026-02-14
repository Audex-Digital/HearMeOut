/**
 * Feed.tsx
 * 
 * The main community stream page where users can browse posts in reverse-chronological order.
 * Features:
 * - Real-time Firestore listener for the 'posts' collection.
 * - Global Comments Modal integration.
 * - Social actions: Connection (friend) request logic and admin post cleanup.
 * 
 * Dependencies:
 * - PostCard & CommentModal components.
 * - useAuth (Relationship logic & Admin checks).
 * - Firebase Firestore (query, orderBy, limit, onSnapshot).
 */

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import PostCard from '../components/Feed/PostCard';
import CommentModal from '../components/Feed/CommentModal';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { alertService } from '../utils/sweetalert';


import LoggedLayout from '../components/Layout/LoggedLayout';
import QuickPost from '../components/Feed/QuickPost';

/** Core post data structure used in the feed. */
interface Post {
  id: string;
  username: string;
  authorId: string;
  content: string;
  createdAt: any;
  likes?: number;
  commentCount?: number;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const { user, isAdmin, sendFriendRequest, cancelFriendRequest } = useAuth();
  const [requestingId, setRequestingId] = useState<string | null>(null);

  /**
   * Main Post Listener.
   */
  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    
    let unsubscribe: () => void;
    try {
      unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const fetchedPosts: Post[] = [];
          snapshot.forEach((doc) => {
            fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
          });
          setPosts(fetchedPosts);
          setLoading(false);
        },
        error: (error) => {
          console.error("Feed listener failure:", error);
          toast.error("Failed to stream community feed.");
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Posts listener setup failed:", error);
      setLoading(false);
      return;
    }

    return () => unsubscribe();
  }, [user]);

  /** 
   * Initiates a friend request with UI loading state. 
   */
  const handleSendRequest = async (targetUid: string) => {
    if (!user?.emailVerified || user?.isAnonymous) {
      toast.error("Verify your email to connect with others.");
      return;
    }
    setRequestingId(targetUid);
    try {
      await sendFriendRequest(targetUid);
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setRequestingId(null);
    }
  };

  /** Cancels a pending outgoing request. */
  const handleCancelRequest = async (targetUid: string) => {
    if (!user?.emailVerified || user?.isAnonymous) return;
    setRequestingId(targetUid);
    try {
      await cancelFriendRequest(targetUid);
    } catch (err) {
      console.error("Cancellation failed:", err);
    } finally {
      setRequestingId(null);
    }
  };

  /** 
   * Deletes a post (Owner or Admin feature).
   */
  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete || !user) return;

    const isOwner = user.uid === postToDelete.authorId;
    const isActuallyAdmin = isAdmin; // from useAuth
    
    // Safety check for permissions: Must be owner or admin
    if (!isActuallyAdmin && !isOwner) {
      toast.error("You don't have permission to delete this post.");
      return;
    }

    const confirmed = await alertService.delete('this community post');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success("Post removed.");
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Critical Failure: Post could not be removed.");
    }
  };

  return (
    <LoggedLayout>
      <div className="max-w-2xl mx-auto">
        {isAdmin && (
          <div className="mb-6 flex items-center gap-3 px-6 py-4 bg-primary/10 border border-primary/20 rounded-3xl group transition-all hover:bg-primary/20">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Moderation Mode</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">You have administrative privileges in this feed.</p>
            </div>
          </div>
        )}
        <QuickPost />

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Feed...</p>
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
            <div className="text-center py-20 px-8 bg-hmo-card border border-dashed border-hmo-border rounded-[2.5rem]">
              <p className="text-slate-500 text-base font-medium italic">
                {!user ? "Please log in to view the community." : "The community is quiet right now. Check back soon."}
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

export default Feed;

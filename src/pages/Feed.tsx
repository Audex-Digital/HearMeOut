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
   * Logic: Subscribes to the 50 most recent posts.
   * Accessible by both verified and guest (anonymous) users.
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
   * @param targetUid - The user to connect with.
   */
  const handleSendRequest = async (targetUid: string) => {
    // Permission Guard: Guests/Unverified users cannot connect.
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
   * Deletes a post (Admin only feature).
   * Logic: Requests user confirmation before calling Firestore deleteDoc.
   */
  const handleDeletePost = async (postId: string) => {
    if (!user?.emailVerified || !isAdmin) return;
    const confirmed = await alertService.delete('this community post');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success("Post removed.");
    } catch (err) {
      console.error("Admin deletion failed:", err);
      toast.error("Critical Failure: Post could not be deleted.");
    }
  };

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Page Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Community Feed</h1>
            <p className="text-slate-400 text-sm">Real thoughts from real people.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <ShieldAlert size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Privileges</span>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
            <div className="text-center py-20 px-6 bg-hmo-card border border-dashed border-hmo-border rounded-3xl">
              <p className="text-slate-400 text-lg italic">
                {!user ? "Please log in to view the community." : "The community is quiet right now. Check back soon."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shared Overlay for viewing replies on any post */}
      <CommentModal 
        post={activePostForComments} 
        onClose={() => setActivePostForComments(null)} 
      />
    </div>
  );
};

export default Feed;

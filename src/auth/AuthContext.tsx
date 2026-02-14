/**
 * AuthContext.tsx
 * 
 * The central authentication and user state management system for HearMeOut.
 * Handles Firebase Auth lifecycle (login, signup, logout, anonymous), 
 * Firestore user profile synchronization, and social relationship logic 
 * (friend requests, connections).
 * 
 * Dependencies:
 * - Firebase Auth (v11+)
 * - Firebase Firestore (v11+)
 * - react-hot-toast (for real-time feedback)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot, 
  addDoc, 
  collection, 
  writeBatch,
  query,
  where,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import toast from 'react-hot-toast';
import { getDoc as firestoreGetDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { checkUsernameAvailability as checkAvailabilityUtil } from '../utils/checkUsernameAvailability';


/**
 * Interface representing the custom application-specific user data
 * stored in Firestore.
 */
interface User {
  uid: string;
  email: string;
  username: string;
  usernameLowercase: string;
  bio?: string;
  memberSince: string;
  createdAt: any; 
  role: 'user' | 'listener' | 'admin';
  listenerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  listenerActive: boolean;
  isPremium: boolean;
  friends: string[]; // Deprecated: Moving to friend_requests (source of truth)
  friendRequestsSent: string[]; // Deprecated
  friendRequestsReceived: string[]; // Deprecated
  emailVerified: boolean;
  isAnonymous: boolean;
}

/** Represents a pending friend connection between two users. */
interface FriendRequest {
  id: string; // Deterministic: {fromUid}_{toUid}
  from: string;
  to: string;
  participants: string[]; // [fromUid, toUid] for easier querying
  status: 'pending' | 'accepted';
  createdAt: any;
  fromUsername?: string; // Optional: cache for UI
}

/**
 * Shape of the context object exposed to the rest of the application.
 */
interface AuthContextType {
  user: User | null;
  friends: string[]; // Array of friend UIDs
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isAdmin: boolean;
  isListener: boolean;
  loading: boolean;
  /** Logs in a user with email and password. */
  login: (email: string, pass: string) => Promise<void>;
  /** Registers a new user and initializes their Firestore profile. */
  signup: (email: string, pass: string, username: string) => Promise<void>;
  /** Logs out the current user and clears profile state. */
  logout: () => Promise<void>;
  /** Updates the current user's profile fields in Firestore. */
  updateProfile: (updates: Partial<User>) => Promise<void>;
  /** Sends a friend request to another user. */
  sendFriendRequest: (targetUid: string) => Promise<void>;
  /** Accepts a pending friend request and establishes a mutual connection. */
  acceptFriendRequest: (senderUid: string) => Promise<void>;
  /** Declines and removes an incoming friend request. */
  rejectFriendRequest: (senderUid: string) => Promise<void>;
  /** Withdraws an outgoing friend request. */
  cancelFriendRequest: (targetUid: string) => Promise<void>;
  /** Breaks a mutual friend connection between two users. */
  removeFriend: (friendUid: string) => Promise<void>;
  /** Forces a reload of the Firebase Auth user object (used for verification checks). */
  refreshAuth: () => Promise<void>;
  /** Resends the verification email to the current user's inbox. */
  resendVerificationEmail: () => Promise<void>;
  /** Signs in a temporary anonymous user (explorer mode). */
  loginAnonymously: () => Promise<void>;
  /** Converts an anonymous user to a permanent account by linking credentials. */
  linkAccount: (email: string, pass: string, username: string) => Promise<void>;
  /** Utility to check if a username is already taken. */
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  /** Applies to become a listener. */
  applyToBeListener: () => Promise<void>;
  /** Approves a listener application (Admin only). */
  approveListener: (applicantUid: string) => Promise<void>;
  /** Rejects a listener application (Admin only). */
  rejectListener: (applicantUid: string) => Promise<void>;
  /** Toggles listener active status (Listener only). */
  toggleListenerActive: (active: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component that wraps the application and supplies Auth logic.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed helper for role checks
  const isAdmin = user?.role === 'admin';
  const isListener = user?.role === 'listener';

  /**
   * Main Auth Observer Effect.
   * Listens for Firebase Auth state changes and manages the Firestore profile sync.
   */
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribeIncoming: (() => void) | null = null;
    let unsubscribeOutgoing: (() => void) | null = null;
    let unsubscribeFriends: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Step 1: Cleanup previous listeners
      [unsubscribeDoc, unsubscribeIncoming, unsubscribeOutgoing, unsubscribeFriends].forEach(unsub => unsub?.());
      unsubscribeDoc = null;
      unsubscribeIncoming = null;
      unsubscribeOutgoing = null;
      unsubscribeFriends = null;

      // Step 2: Handle logged out
      if (!firebaseUser) {
        console.log("[AuthContext] No user found, clearing state.");
        setUser(null);
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setLoading(false);
        return;
      }

      console.log(`[AuthContext] User detected: ${firebaseUser.uid}`);

      // Basic User mapping for early UI display
      const basicUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || 'Guest',
        usernameLowercase: (firebaseUser.displayName || 'Guest').toLowerCase(),
        emailVerified: firebaseUser.emailVerified,
        isAnonymous: firebaseUser.isAnonymous,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        createdAt: null,
        role: 'user',
        listenerStatus: 'none',
        listenerActive: false,
        isPremium: false,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: []
      };

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Ensure Profile exists
        const snap = await firestoreGetDoc(userRef);
        if (!snap.exists()) {
          console.warn(`[AuthContext] Profile missing for ${firebaseUser.uid}. Creating recovery document...`);
          await setDoc(userRef, { ...basicUser, createdAt: serverTimestamp(), bio: '' });
        }

        // --- Profile Sync ---
        unsubscribeDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as User;
            setUser({ ...data, emailVerified: firebaseUser.emailVerified, isAnonymous: firebaseUser.isAnonymous });
          } else {
            setUser(basicUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("[AuthContext] User doc sync error:", error);
          setUser(basicUser);
          setLoading(false);
        });

        // --- Accepted Friends Sync ---
        const friendsQuery = query(
          collection(db, 'friend_requests'),
          where('participants', 'array-contains', firebaseUser.uid),
          where('status', '==', 'accepted')
        );
        unsubscribeFriends = onSnapshot(friendsQuery, (snap) => {
          const friendUids = snap.docs.map(d => {
            const data = d.data();
            return data.from === firebaseUser.uid ? data.to : data.from;
          });
          setFriends(friendUids);
        });

        // --- Incoming Friend Requests Sync ---
        const incomingQuery = query(collection(db, 'friend_requests'), where('to', '==', firebaseUser.uid), where('status', '==', 'pending'));
        unsubscribeIncoming = onSnapshot(incomingQuery, (snap) => {
          const reqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
          setIncomingRequests(reqs);
        });

        // --- Outgoing Friend Requests Sync ---
        const outgoingQuery = query(collection(db, 'friend_requests'), where('from', '==', firebaseUser.uid), where('status', '==', 'pending'));
        unsubscribeOutgoing = onSnapshot(outgoingQuery, (snap) => {
          const reqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
          setOutgoingRequests(reqs);
        });

      } catch (error) {
        console.error("[AuthContext] Profile initialization failed:", error);
        setUser(basicUser);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      [unsubscribeDoc, unsubscribeIncoming, unsubscribeOutgoing, unsubscribeFriends].forEach(unsub => unsub?.());
    };
  }, []);

  /** Logs in existing user. */
  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Login failed:", err);
      toast.error(err.message || "Invalid credentials.");
      throw err;
    }
  };

  /** 
   * Utility to check if a username is already taken. 
   * Returns true if available, false if taken.
   */
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    // We can also add context-aware logic here (like checking if it's the current user's name)
    // but for now we'll stick to the global utility as requested.
    try {
      const available = await checkAvailabilityUtil(username);
      
      // Edge Case: If user is logged in (e.g. updating profile), 
      // check if it's already theirs
      if (!available && auth.currentUser) {
        const lower = username.trim().toLowerCase();
        const nameRef = doc(db, 'usernames', lower);
        const nameSnap = await firestoreGetDoc(nameRef);
        if (nameSnap.exists() && nameSnap.data().uid === auth.currentUser.uid) {
          return true;
        }
      }
      return available;
    } catch (err) {
      throw err; // Let caller handle "Unknown" states
    }
  };

  /** Registers new user, creates their Firestore profile, and sends verification. */
  const signup = async (email: string, pass: string, username: string) => {
    const trimmedUsername = username.trim();
    const lowerUsername = trimmedUsername.toLowerCase();
    
    console.log(`[Signup] Attempting signup for ${email} with username ${trimmedUsername}`);

    // Step 1: Pre-emptive uniqueness check
    const isAvailable = await checkUsernameAvailability(trimmedUsername);
    if (!isAvailable) {
      console.warn(`[Signup] Username ${trimmedUsername} is already taken.`);
      throw new Error("This username is already taken. Please choose another.");
    }

    let firebaseUser: FirebaseUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      firebaseUser = userCredential.user;
      console.log(`[Signup] Auth account created: ${firebaseUser.uid}`);
    } catch (error: any) {
      console.error("[Signup] Auth creation failed:", error);
      throw error;
    }

    if (firebaseUser) {
      try {
        const batch = writeBatch(db);
        
        const userData: User = {
          uid: firebaseUser.uid,
          email: email,
          username: trimmedUsername,
          usernameLowercase: lowerUsername,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          createdAt: serverTimestamp(),
          role: 'user' as const,
          listenerStatus: 'none',
          listenerActive: false,
          isPremium: false,
          bio: '',
          friends: [],
          friendRequestsSent: [],
          friendRequestsReceived: [],
          emailVerified: false,
          isAnonymous: false
        };
        
        console.log("[Signup] Initializing Firestore documents...");
        // 1. Create the user document
        batch.set(doc(db, 'users', firebaseUser.uid), userData);
        
        // 2. Reserve the username globally
        batch.set(doc(db, 'usernames', lowerUsername), {
          uid: firebaseUser.uid,
          createdAt: serverTimestamp()
        });

        await batch.commit();
        console.log("[Signup] Firestore data initialized successfully.");
        
        // Fire off verification email immediately
        await sendEmailVerification(firebaseUser);
        console.log("[Signup] Verification email sent.");
        
        // Initial state update
        setUser({
          ...userData,
          createdAt: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous
        });
      } catch (error: any) {
        console.error("[Signup] Firestore initialization failed:", error);
        
        // ROLLBACK: If Firestore fails, we MUST delete the newly created Auth user
        // to allow them to retry with the same email.
        if (firebaseUser) {
          try {
            console.log("[Signup] Rolling back Auth account...");
            await deleteUser(firebaseUser);
            console.log("[Signup] Auth rollback successful.");
          } catch (deleteError) {
            console.error("[Signup] Cleanup rollback failed:", deleteError);
          }
        }

        const firestoreError = new Error("Account creation failed during setup. Please check your connection or try a different username.");
        (firestoreError as any).code = 'firestore/creation-failed';
        throw firestoreError;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  /** 
   * Updates user-defined fields like 'bio'. 
   * Future enhancement: If username is updated, ensure uniqueness and update usernameLowercase history.
   */
  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Ensure usernameLowercase stays in sync if username is ever updated
        if (updates.username) {
          updates.usernameLowercase = updates.username.toLowerCase();
        }

        await updateDoc(userRef, updates);
        // Explicitly sync local state for instant UI update
        setUser(prev => prev ? { ...prev, ...updates } : null);
        toast.success("Profile saved!");
      } catch (err) {
        console.error("Profile update failed:", err);
        toast.error("Failed to save changes.");
        throw err;
      }
    }
  };

  /**
   * Initiates a friend request.
   * Logic: 
   * 1. Creates a document in /friend_requests/{myUid}_{targetUid}
   * 2. Triggers a 'friend_request' notification for the recipient.
   * 
   * Uses an atomic batch write to ensure consistency.
   */
  const sendFriendRequest = async (targetUid: string) => {
    if (!user || user.uid === targetUid) return;
    
    console.log(`[Social] Sending friend request to ${targetUid}`);
    const requestId = `${user.uid}_${targetUid}`;
    
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, 'friend_requests', requestId);
      const notifRef = doc(collection(db, 'notifications'));

      // 1. Create Friend Request Document
      batch.set(requestRef, {
        from: user.uid,
        to: targetUid,
        participants: [user.uid, targetUid],
        status: 'pending',
        fromUsername: user.username,
        createdAt: serverTimestamp()
      });

      // 2. Create Notification
      batch.set(notifRef, {
        recipientId: targetUid,
        fromUserId: user.uid,
        fromUsername: user.username,
        type: 'friend_request',
        createdAt: serverTimestamp(),
        read: false
      });

      await batch.commit();
      console.log("[Social] Friend request document created.");
      toast.success("Connection request sent!");
    } catch (err: any) {
      console.error("[Social] Send friend request failed:", err);
      toast.error(err.message || "Operation failed. Try again.");
      throw err;
    }
  };

    /** 
   * Confirms a mutual friendship. 
   * Logic: 
   * 1. Updates the request status to 'accepted' in friend_requests.
   * 2. Initializes a Chat record.
   */
  const acceptFriendRequest = async (senderUid: string) => {
    if (!user) {
      console.warn("acceptFriendRequest called without authenticated user");
      return;
    }
    const requestId = `${senderUid}_${user.uid}`;
    console.log(`Attempting to accept friend request: ${requestId} for user: ${user.uid}`);
    
    try {
      const requestRef = doc(db, 'friend_requests', requestId);
      
      // 1. Update the request status to 'accepted'
      console.log("Stepping 1: Updating friend_requests status...");
      await updateDoc(requestRef, { status: 'accepted' }).catch(err => {
        console.error("DEBUG: Failed to update friend_requests. Check if rules allow 'update' on this doc for this user.", err);
        throw err;
      });

      // 2. Fetch sender data for chat metadata
      console.log("Stepping 2: Fetching sender profile...");
      const senderSnap = await firestoreGetDoc(doc(db, 'users', senderUid)).catch(err => {
        console.error("DEBUG: Failed to fetch sender profile. Check 'users' read rules.", err);
        throw err;
      });
      const senderData = senderSnap.data();

      // 3. Create chat metadata
      console.log("Stepping 3: Initializing chat document...");
      const chatId = user.uid < senderUid ? `${user.uid}_${senderUid}` : `${senderUid}_${user.uid}`;
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, senderUid],
        lastActivity: serverTimestamp(),
        lastMessage: "You are now connected! Say hi.",
        type: 'social',
        [`participantNames.${user.uid}`]: user.username,
        [`participantNames.${senderUid}`]: senderData?.username || 'New Friend'
      }, { merge: true }).catch(err => {
        console.error("DEBUG: Failed to create chat doc. Check 'chats' rules.", err);
        throw err;
      });

      toast.success("New connection established!");
    } catch (err: any) {
      console.error("Full Acceptance Trace:", err);
      if (err.code === 'permission-denied') {
        toast.error("Permission Denied: Ensure production security rules are updated.");
      } else {
        toast.error("Failed to accept connection.");
      }
    }
  };

  /** Declines an incoming request. */
  const rejectFriendRequest = async (senderUid: string) => {
    if (!user) return;
    const requestId = `${senderUid}_${user.uid}`;
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      toast.success("Request declined.");
    } catch (err) {
      console.error("Rejection failed:", err);
      toast.error("Failed to reject request.");
    }
  };

  /** Cancels an outgoing request. */
  const cancelFriendRequest = async (targetUid: string) => {
    if (!user) return;
    const requestId = `${user.uid}_${targetUid}`;
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      toast.success("Request cancelled.");
    } catch (err) {
      console.error("Cancellation failed:", err);
      toast.error("Failed to cancel request.");
    }
  };

  /** Severs a mutual connection. */
  const removeFriend = async (friendUid: string) => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('participants', 'array-contains', user.uid),
        where('status', '==', 'accepted')
      );
      const snap = await getDocs(q);
      const requestDoc = snap.docs.find(d => {
        const data = d.data();
        return data.participants.includes(friendUid);
      });

      if (requestDoc) {
        await deleteDoc(requestDoc.ref);
        toast.success("Connection severed.");
      }
    } catch (err) {
      console.error("Removal failed:", err);
      toast.error("Failed to remove friend.");
      throw err;
    }
  };

  /** Manual reload of Auth user status. Typically used to check if email was verified. */
  const refreshAuth = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const firebaseUser = auth.currentUser;
        
        // Sync local React state
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            emailVerified: firebaseUser.emailVerified
          };
        });
      } catch (error) {
        console.error("Credential refresh failed:", error);
      }
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error: any) {
        console.error("Verification resend failed:", error);
        throw error;
      }
    }
  };

  /** Signs in a temporary anonymous user profile. Use for 'Trial' modes. */
  const loginAnonymously = async () => {
    try {
      const { user: firebaseUser } = await signInAnonymously(auth);
      
      const userData: User = {
        uid: firebaseUser.uid,
        email: '',
        username: `Explorer_${firebaseUser.uid.slice(0, 5)}`,
        usernameLowercase: `explorer_${firebaseUser.uid.slice(0, 5)}`.toLowerCase(),
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        createdAt: serverTimestamp(),
        role: 'user' as const,
        listenerStatus: 'none',
        listenerActive: false,
        isPremium: false,
        bio: 'Anonymous explorer',
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        emailVerified: false,
        isAnonymous: true
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    } catch (error: any) {
      console.error("Explorer login failed:", error);
      throw error;
    }
  };

  /** Promotes an anonymous guest account to a permanent email/pass account. */
  const linkAccount = async (email: string, pass: string, username: string) => {
    if (!auth.currentUser) throw new Error("No active guest account found.");
    const lowerUsername = username.toLowerCase();

    // Step 1: Check availability first
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error("This username is already taken.");
    }
    
    try {
      const credential = EmailAuthProvider.credential(email, pass);
      const { user: firebaseUser } = await linkWithCredential(auth.currentUser, credential);
      
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', firebaseUser.uid);
      const nameRef = doc(db, 'usernames', lowerUsername);

      const updates = {
        email: email,
        username: username,
        usernameLowercase: lowerUsername,
      };
      
      // Update custom Firestore profile
      batch.update(userRef, updates);
      
      // Reserve username
      batch.set(nameRef, {
        uid: firebaseUser.uid,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      await sendEmailVerification(firebaseUser);
    } catch (error: any) {
      console.error("Account upgrade failed:", error);
      throw error;
    }
  };

  /**
   * Applies to become a listener.
   */
  const applyToBeListener = async () => {
    if (!user || user.listenerStatus !== 'none') return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { listenerStatus: 'pending' });

      // Notify admins
      await addDoc(collection(db, 'notifications'), {
        type: 'listener_application',
        applicantUid: user.uid,
        applicantUsername: user.username,
        createdAt: serverTimestamp(),
        read: false,
        recipientRole: 'admin'
      });
      
      toast.success("Application submitted!");
    } catch (err) {
      console.error("Application failed:", err);
      toast.error("Failed to submit application.");
    }
  };

  /**
   * Approves a listener application.
   */
  const approveListener = async (applicantUid: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', applicantUid);
      await updateDoc(userRef, { 
        role: 'listener',
        listenerStatus: 'approved',
        listenerActive: false
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        recipientId: applicantUid,
        type: 'listener_approved',
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast.success("Listener approved!");
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error("Failed to approve listener.");
    }
  };

  /**
   * Rejects a listener application.
   */
  const rejectListener = async (applicantUid: string) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', applicantUid);
      await updateDoc(userRef, { listenerStatus: 'rejected' });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        recipientId: applicantUid,
        type: 'listener_rejected',
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast.success("Listener rejected.");
    } catch (err) {
      console.error("Rejection failed:", err);
      toast.error("Failed to reject listener.");
    }
  };

  /**
   * Toggles listener active status.
   */
  const toggleListenerActive = async (active: boolean) => {
    if (!isListener || !user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { listenerActive: active });
      setUser(prev => prev ? { ...prev, listenerActive: active } : null);
      toast.success(active ? "You are now active!" : "You are now offline.");
    } catch (err) {
      console.error("Toggle failed:", err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, friends, incomingRequests, outgoingRequests, isAdmin, isListener, loading, login, signup, logout, updateProfile,
      sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend,
      refreshAuth, resendVerificationEmail, loginAnonymously, linkAccount, checkUsernameAvailability,
      applyToBeListener, approveListener, rejectListener, toggleListenerActive
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication state and handlers.
 * @throws {Error} if used outside of <AuthProvider />
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

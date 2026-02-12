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
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  addDoc, 
  collection, 
  writeBatch
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
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  emailVerified: boolean;
  isAnonymous: boolean;
}

/**
 * Shape of the context object exposed to the rest of the application.
 */
interface AuthContextType {
  user: User | null;
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Step 1: Cleanup previous listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      // Step 2: Handle logged out
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Step 3: Local basic state
      const basicUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || 'Guest',
        usernameLowercase: (firebaseUser.displayName || 'Guest').toLowerCase(),
        emailVerified: firebaseUser.emailVerified,
        isAnonymous: firebaseUser.isAnonymous,
        memberSince: '',
        createdAt: null,
        role: 'user',
        listenerStatus: 'none',
        listenerActive: false,
        isPremium: false,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: []
      };

      // Step 4: Sync Profile
      if (firebaseUser.emailVerified || firebaseUser.isAnonymous) {
        try {
          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as User;
              
              // Lazy Migration
              if (data.username && !data.usernameLowercase) {
                updateDoc(doc(db, 'users', firebaseUser.uid), {
                  usernameLowercase: data.username.toLowerCase()
                }).catch(err => console.error("Lazy migration failed:", err));
              }

              setUser({ 
                ...data, 
                emailVerified: firebaseUser.emailVerified, 
                isAnonymous: firebaseUser.isAnonymous 
              });
            } else {
              setUser(basicUser);
            }
            setLoading(false);
          }, (error) => {
            console.error("User doc sync error:", error);
            setUser(basicUser);
            setLoading(false);
          });
        } catch (error) {
          console.error("Listener setup failed:", error);
          setUser(basicUser);
          setLoading(false);
        }
      } else {
        setUser(basicUser);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
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
    
    // Step 1: Pre-emptive uniqueness check
    const isAvailable = await checkUsernameAvailability(trimmedUsername);
    if (!isAvailable) {
      throw new Error("This username is already taken. Please choose another.");
    }

    let firebaseUser: FirebaseUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      firebaseUser = userCredential.user;
    } catch (error: any) {
      console.error("Auth creation failed:", error);
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
        
        // 1. Create the user document
        batch.set(doc(db, 'users', firebaseUser.uid), userData);
        
        // 2. Reserve the username globally
        batch.set(doc(db, 'usernames', lowerUsername), {
          uid: firebaseUser.uid,
          createdAt: serverTimestamp()
        });

        await batch.commit();
        
        // Fire off verification email immediately
        await sendEmailVerification(firebaseUser);
        
        // Initial state update
        setUser({
          ...userData,
          createdAt: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous
        });
      } catch (error: any) {
        console.error("Firestore initialization failed:", error);
        
        // ROLLBACK: If Firestore fails, we MUST delete the newly created Auth user
        // to allow them to retry with the same email.
        if (firebaseUser) {
          try {
            await deleteUser(firebaseUser);
          } catch (deleteError) {
            console.error("Cleanup rollback failed:", deleteError);
          }
        }

        const firestoreError = new Error("Account creation failed during setup. Please try again.");
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
   * Logic: Adds target UID to sender's outgoing list and sender UID to target's incoming list.
   * Triggers a 'friend_request' notification for the recipient.
   */
  const sendFriendRequest = async (targetUid: string) => {
    if (!user || user.uid === targetUid) return;
    try {
      const myRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', targetUid);

      await updateDoc(myRef, { friendRequestsSent: arrayUnion(targetUid) });
      await updateDoc(targetRef, { friendRequestsReceived: arrayUnion(user.uid) });

      // Add to notifications collection for real-time toaster/panel feedback
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetUid,
        fromUserId: user.uid,
        fromUsername: user.username,
        type: 'friend_request',
        createdAt: serverTimestamp(),
        read: false
      });
      toast.success("Connection request sent!");
    } catch (err) {
      console.error("Send friend request failed:", err);
      toast.error("Operation failed. Try again.");
    }
  };

  /** 
   * Confirms a mutual friendship. 
   * Logic: Moves UIDs from 'pending' arrays to 'friends' arrays on both documents.
   */
  const acceptFriendRequest = async (senderUid: string) => {
    if (!user) return;
    try {
      const myRef = doc(db, 'users', user.uid);
      const senderRef = doc(db, 'users', senderUid);

      const batch = writeBatch(db);

      // 1. Update social relationships
      batch.update(myRef, {
        friends: arrayUnion(senderUid),
        friendRequestsReceived: arrayRemove(senderUid)
      });
      batch.update(senderRef, {
        friends: arrayUnion(user.uid),
        friendRequestsSent: arrayRemove(user.uid)
      });

      // 2. Automatically initialize a Chat box metadata
      const chatId = user.uid < senderUid ? `${user.uid}_${senderUid}` : `${senderUid}_${user.uid}`;
      
      // Fetch sender's username for the metadata (since we'll need it in ChatList later)
      // We'll perform a separate getDoc before the batch commit to be safe,
      // or just use deterministic naming in the chat record.
      const senderSnap = await firestoreGetDoc(senderRef);
      const senderData = senderSnap.data();

      batch.set(doc(db, 'chats', chatId), {
        participants: [user.uid, senderUid],
        lastActivity: serverTimestamp(),
        lastMessage: "You are now connected! Say hi.",
        type: 'social',
        [`participantNames.${user.uid}`]: user.username,
        [`participantNames.${senderUid}`]: senderData?.username || 'New Friend'
      }, { merge: true });

      await batch.commit();
      toast.success("New connection established!");
    } catch (err) {
      console.error("Acceptance failed:", err);
      toast.error("Failed to accept connection.");
    }
  };

  /** Declines an incoming request. */
  const rejectFriendRequest = async (senderUid: string) => {
    if (!user) return;
    try {
      const myRef = doc(db, 'users', user.uid);
      const senderRef = doc(db, 'users', senderUid);

      await updateDoc(myRef, { friendRequestsReceived: arrayRemove(senderUid) });
      await updateDoc(senderRef, { friendRequestsSent: arrayRemove(user.uid) });
      toast.success("Request declined.");
    } catch (err) {
      console.error("Rejection failed:", err);
      toast.error("Failed to reject request.");
    }
  };

  /** Cancels an outgoing request. */
const cancelFriendRequest = async (targetUid: string) => {
  if (!user) return;
  const batch = writeBatch(db);
  const myRef = doc(db, 'users', user.uid);
  const targetRef = doc(db, 'users', targetUid);

  // Remove target from my sent requests (owner – allowed)
  batch.update(myRef, {
    friendRequestsSent: arrayRemove(targetUid)
  });

  // Remove myself from target's received requests (non‑owner – now allowed via Case 1 removal)
  batch.update(targetRef, {
    friendRequestsReceived: arrayRemove(user.uid)
  });

  await batch.commit();
};

  /** Severs a mutual connection. */
  const removeFriend = async (friendUid: string) => {
    if (!user) return;
    try {
      const myRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendUid);

      await updateDoc(myRef, { friends: arrayRemove(friendUid) });
      await updateDoc(friendRef, { friends: arrayRemove(user.uid) });
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
      user, isAdmin, isListener, loading, login, signup, logout, updateProfile,
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

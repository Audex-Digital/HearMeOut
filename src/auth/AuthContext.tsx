import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface User {
  uid: string;
  email: string;
  username: string;
  bio?: string;
  memberSince: string;
  createdAt: any; 
  role: 'user' | 'admin';
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  sendFriendRequest: (targetUid: string) => Promise<void>;
  acceptFriendRequest: (senderUid: string) => Promise<void>;
  rejectFriendRequest: (senderUid: string) => Promise<void>;
  cancelFriendRequest: (targetUid: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous doc listener if any
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      try {
        if (firebaseUser) {
          // Listen for real-time updates to the user document
          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
            if (snapshot.exists()) {
              setUser(snapshot.data() as User);
            } else {
              // Account might be newly created or deleted
              setUser(null);
            }
            setLoading(false);
          }, (error) => {
            console.warn("User doc sync error:", error);
            setLoading(false);
          });
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.warn("Auth state sync error:", error);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, username: string) => {
    // 1. Create the Auth account
    let firebaseUser: FirebaseUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      firebaseUser = userCredential.user;
    } catch (error: any) {
      // Re-throw identifiable auth errors for the UI
      throw error;
    }

    // 2. Create the Firestore document
    if (firebaseUser) {
      try {
        const userData = {
          uid: firebaseUser.uid,
          email: email,
          username: username,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          createdAt: serverTimestamp(),
          role: 'user' as const,
          bio: '',
          friends: [],
          friendRequestsSent: [],
          friendRequestsReceived: []
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        // We set the user state manually with a serializable date for the UI
        // while the server processes the serverTimestamp
        setUser({
          ...userData,
          createdAt: new Date().toISOString()
        });
      } catch (error: any) {
        console.error("Firestore user creation failed:", error);
        // Special error code for the UI to handle partial success
        const firestoreError = new Error("Account created successfully, but your profile couldn't be initialized. Technical details: " + error.message);
        (firestoreError as any).code = 'firestore/creation-failed';
        throw firestoreError;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const sendFriendRequest = async (targetUid: string) => {
    if (!user || user.uid === targetUid) return;
    const myRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', targetUid);

    await updateDoc(myRef, { friendRequestsSent: arrayUnion(targetUid) });
    await updateDoc(targetRef, { friendRequestsReceived: arrayUnion(user.uid) });
  };

  const acceptFriendRequest = async (senderUid: string) => {
    if (!user) return;
    const myRef = doc(db, 'users', user.uid);
    const senderRef = doc(db, 'users', senderUid);

    await updateDoc(myRef, {
      friends: arrayUnion(senderUid),
      friendRequestsReceived: arrayRemove(senderUid)
    });
    await updateDoc(senderRef, {
      friends: arrayUnion(user.uid),
      friendRequestsSent: arrayRemove(user.uid)
    });
  };

  const rejectFriendRequest = async (senderUid: string) => {
    if (!user) return;
    const myRef = doc(db, 'users', user.uid);
    const senderRef = doc(db, 'users', senderUid);

    await updateDoc(myRef, { friendRequestsReceived: arrayRemove(senderUid) });
    await updateDoc(senderRef, { friendRequestsSent: arrayRemove(user.uid) });
  };

  const cancelFriendRequest = async (targetUid: string) => {
    if (!user) return;
    const myRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', targetUid);

    await updateDoc(myRef, { friendRequestsSent: arrayRemove(targetUid) });
    await updateDoc(targetRef, { friendRequestsReceived: arrayRemove(user.uid) });
  };

  const removeFriend = async (friendUid: string) => {
    if (!user) return;
    const myRef = doc(db, 'users', user.uid);
    const friendRef = doc(db, 'users', friendUid);

    await updateDoc(myRef, { friends: arrayRemove(friendUid) });
    await updateDoc(friendRef, { friends: arrayRemove(user.uid) });
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAdmin, loading, login, signup, logout, updateProfile,
      sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

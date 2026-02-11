/**
 * config.ts
 * 
 * Central Firebase initialization for the HearMeOut application.
 * Configures Firebase App, Authentication, and Firestore with 
 * persistent multi-tab caching.
 * 
 * Dependencies:
 * - Firebase Web SDK v11+
 * - Vite Environment Variables (.env)
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

/**
 * Firebase project configuration retrieved from environment variables.
 * These are injected during the Vite build process.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize the core Firebase App instance.
const app = initializeApp(firebaseConfig);

/**
 * Shared Auth instance used across the application.
 */
export const auth = getAuth(app);

/**
 * Firestore Database instance with persistent offline caching.
 * Uses `persistentMultipleTabManager` to allow multiple browser tabs
 * to share the same indexedDB cache safely.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

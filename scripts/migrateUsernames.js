/**
 * migrateUsernames.js
 * 
 * Standalone migration script to backfill 'usernameLowercase' 
 * and reserve handles in the 'usernames' collection.
 * 
 * Instructions:
 * 1. Fill in your Firebase configuration from your config file.
 * 2. Install dependencies if needed (npm install firebase)
 * 3. Run with 'node scripts/migrateUsernames.js'
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURATION ---
// Replace with your project settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runMigration() {
  console.log("🚀 Initializing Global Username Migration...");
  
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    console.log(`🔍 Found ${snapshot.size} user profiles. Analyzing constraints...`);
    
    let processed = 0;
    let conflicts = 0;

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const uid = userDoc.id;
      const username = data.username;

      if (!username) {
        console.warn(`⚠️ [Skip] User ${uid} has no defined username.`);
        continue;
      }

      const lower = username.toLowerCase();
      
      try {
        const nameRef = doc(db, 'usernames', lower);
        const nameSnap = await getDoc(nameRef);
        
        const batch = writeBatch(db);

        // Check if the username is already taken by someone else
        if (!nameSnap.exists()) {
          batch.set(nameRef, {
            uid: uid,
            createdAt: serverTimestamp()
          });
          console.log(`✅ [Reserved] ${username} -> ${uid}`);
        } else if (nameSnap.data().uid !== uid) {
          console.error(`❌ [Conflict] Handle '@${lower}' is already registered to ${nameSnap.data().uid}. Skipping ${uid}.`);
          conflicts++;
          continue;
        }

        // Add the lowercase searching field if it's missing
        if (!data.usernameLowercase) {
          batch.update(doc(db, 'users', uid), {
            usernameLowercase: lower
          });
        }

        await batch.commit();
        processed++;
      } catch (err) {
        console.error(`🔥 [Error] Failed to process ${username}:`, err.message);
      }
    }

    console.log("\n=========================");
    console.log("📊 MIGRATION SUMMARY");
    console.log(`- Successfully Updated: ${processed}`);
    console.log(`- Identity Conflicts:   ${conflicts}`);
    console.log("=========================\n");
    
  } catch (err) {
    console.error("⛔ Fatal Script Error:", err);
  } finally {
    process.exit();
  }
}

runMigration();

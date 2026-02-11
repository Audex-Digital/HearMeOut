import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Utility to check if a username is already taken.
 * 
 * Logic:
 * 1. Normalize input to trim and lowercase (case-insensitive uniqueness).
 * 2. Check existence of reservation document in 'usernames' collection.
 * 
 * @param username - The handle to check.
 * @returns Promise<boolean> - true if available, false if taken.
 * @throws - Will propogate Firestore errors (e.g. network/permission).
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username || username.trim().length < 3) return false;
  
  const normalizedUsername = username.trim().toLowerCase();
  
  try {
    const nameRef = doc(db, 'usernames', normalizedUsername);
    const nameSnap = await getDoc(nameRef);
    
    const exists = nameSnap.exists();
    console.log(`[UsernameService] Checking "${normalizedUsername}": ${exists ? 'TAKEN' : 'AVAILABLE'}`);
    
    // Available if document does not exist
    return !exists;
  } catch (error) {
    console.error(`[UsernameService] Error checking "${normalizedUsername}":`, error);
    throw error;
  }
};

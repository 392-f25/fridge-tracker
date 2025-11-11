import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom'
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type NextOrObserver, type User} from 'firebase/auth';
import { getDatabase, ref, push, set, update, get } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyCb2VEZ20PgQEzF2niZxLn-ik1QilHS87k",
  authDomain: "when2eat-fb846.firebaseapp.com",
  databaseURL: "https://when2eat-fb846-default-rtdb.firebaseio.com",
  projectId: "when2eat-fb846",
  storageBucket: "when2eat-fb846.firebasestorage.app",
  messagingSenderId: "201790977660",
  appId: "1:201790977660:web:ced9e9182d0d2b70d73bf9",
  measurementId: "G-76R34KTB5B"
};

// Initialize Firebase
console.log('[Firebase] Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  databaseURL: firebaseConfig.databaseURL
});

const firebase = initializeApp(firebaseConfig);
const auth = getAuth(firebase);
export const database = getDatabase(firebase);
export const storage = getStorage(firebase);
const functionsInstance = getFunctions(firebase, 'us-central1');

import { connectFunctionsEmulator } from 'firebase/functions';

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
}


export interface TestEmailResponse {
  status: 'sent' | 'skipped';
  counts?: {
    expired: number;
    expiring: number;
  };
  reason?: 'NO_USER' | 'NO_EMAIL' | 'NO_ITEMS';
}

export const triggerTestExpirationEmail = async (): Promise<TestEmailResponse> => {
  const callable = httpsCallable<void, TestEmailResponse>(functionsInstance, 'sendTestExpirationEmail');
  const result = await callable();
  return result.data;
};

console.log('[Firebase] Firebase initialized successfully');
console.log('[Firebase] Database instance:', database);
console.log('[Firebase] Storage instance:', storage);

/**
 * Create or update user in database
 */
const ensureUserInDatabase = async (user: User) => {
  console.log('[ensureUserInDatabase] Setting up user in database:', user.uid);

  const userRef = ref(database, `users/${user.uid}`);

  try {
    // Check if user already exists
    const snapshot = await get(userRef);

    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: Date.now()
    };

    if (!snapshot.exists()) {
      // Create new user with additional fields
      console.log('[ensureUserInDatabase] Creating new user in database');
      await set(userRef, {
        ...userData,
        createdAt: Date.now()
      });
      console.log('[ensureUserInDatabase] New user created successfully');
    } else {
      // Update existing user's last login
      console.log('[ensureUserInDatabase] Updating existing user');
      await update(userRef, userData);
      console.log('[ensureUserInDatabase] User updated successfully');
    }
  } catch (error) {
    console.error('[ensureUserInDatabase] Failed to setup user:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  console.log('[signInWithGoogle] Starting Google sign-in...');

  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    console.log('[signInWithGoogle] Sign-in successful:', result.user.uid);

    // Create/update user in database
    await ensureUserInDatabase(result.user);

    return result.user;
  } catch (error) {
    console.error('[signInWithGoogle] Sign-in failed:', error);
    throw error;
  }
};

const firebaseSignOut = () => signOut(auth);

export { firebaseSignOut as signOut };

export interface AuthState {
  user: User | null,
  isAuthenticated: boolean,
  isInitialLoading: boolean
}

export const addAuthStateListener = (fn: NextOrObserver<User>): (()=> void) => (
  onAuthStateChanged(auth, fn)
);

export const useAuthState = (): AuthState => {
  const [user, setUser] = useState(auth.currentUser)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const isAuthenticated = !!user;

  useEffect(() => {
    const unsubscribe = addAuthStateListener(async (user) => {
      flushSync(() => {
        setUser(user);
        setIsInitialLoading(false);
      });

      // Ensure user is in database when they sign in or are already signed in
      if (user) {
        try {
          await ensureUserInDatabase(user);
        } catch (error) {
          console.error('[useAuthState] Failed to ensure user in database:', error);
        }
      }
    });

    return unsubscribe;
  }, [])

  return {user, isAuthenticated, isInitialLoading };
};

// ===== Realtime Database Helper Functions =====

/**
 * Get reference to user's fridge items
 */
export const getFridgeItemsRef = (userId: string) =>
  ref(database, `users/${userId}/fridgeItems`);

/**
 * Get reference to receipt queue
 */
export const getReceiptQueueRef = () =>
  ref(database, 'receipts/queue');

/**
 * Get reference to processed receipts
 */
export const getReceiptProcessedRef = () =>
  ref(database, 'receipts/processed');

/**
 * Get reference to failed receipts
 */
export const getReceiptFailedRef = () =>
  ref(database, 'receipts/failed');

// ===== Firebase Storage Helper Functions =====

/**
 * Upload receipt image to Firebase Storage
 * @param file - Image file to upload
 * @param userId - User ID for organizing uploads
 * @returns Promise with download URL
 */
export const uploadReceiptImage = async (
  file: File,
  userId: string
): Promise<string> => {
  console.log('[uploadReceiptImage] Starting upload...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId
  });

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
  if (!validTypes.includes(file.type)) {
    console.error('[uploadReceiptImage] Invalid file type:', file.type);
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or HEIC image.');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    console.error('[uploadReceiptImage] File too large:', file.size);
    throw new Error('File too large. Maximum size is 10MB.');
  }

  // Create unique filename
  const timestamp = Date.now();
  const filename = `receipts/${userId}/${timestamp}_${file.name}`;
  console.log('[uploadReceiptImage] Uploading to path:', filename);
  const imageRef = storageRef(storage, filename);

  try {
    // Upload file
    console.log('[uploadReceiptImage] Calling uploadBytes...');
    const snapshot = await uploadBytes(imageRef, file);
    console.log('[uploadReceiptImage] Upload complete, getting download URL...');

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[uploadReceiptImage] Success! Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('[uploadReceiptImage] Upload failed:', error);
    throw error;
  }
};

/**
 * Trigger receipt processing by adding to queue
 * @param imageUrl - Firebase Storage URL of receipt image
 * @param userId - User ID
 * @returns Receipt ID
 */
export const queueReceiptProcessing = async (
  imageUrl: string,
  userId: string
): Promise<string> => {
  console.log('[queueReceiptProcessing] Adding receipt to queue...', {
    imageUrl,
    userId
  });

  try {
    const queueRef = push(ref(database, 'receipts/queue'));
    const receiptId = queueRef.key!;
    console.log('[queueReceiptProcessing] Generated receipt ID:', receiptId);

    const data = {
      imageUrl,
      userId,
      timestamp: Date.now()
    };
    console.log('[queueReceiptProcessing] Writing data to database:', data);

    await set(queueRef, data);
    console.log('[queueReceiptProcessing] Successfully queued receipt:', receiptId);

    return receiptId;
  } catch (error) {
    console.error('[queueReceiptProcessing] Failed to queue receipt:', error);
    throw error;
  }
};

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom'
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type NextOrObserver, type User} from 'firebase/auth';

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
const firebase = initializeApp(firebaseConfig);
const auth = getAuth(firebase);

export const signInWithGoogle = () => {
  signInWithPopup(auth, new GoogleAuthProvider());
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

  useEffect(() => addAuthStateListener((user) => {
      flushSync(() => {
        setUser(user);
        setIsInitialLoading(false);
      })
    }), [])

  return {user, isAuthenticated, isInitialLoading };
};

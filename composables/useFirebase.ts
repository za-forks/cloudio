import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, setDoc, 
  doc, query, onSnapshot, writeBatch, deleteDoc, updateDoc, 
  orderBy, where, limit, increment 
} from "firebase/firestore";
import type { DocumentData, Query } from "firebase/firestore";

// 1. Centralized "Safe" Initialization
const getSafeApp = () => {
  // Only run on client to prevent SSR Hydration Mismatches
  if (process.server) return null; 

  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY,
    projectId: config.public.FIREBASE_PROJECT_ID,
    authDomain: `${config.public.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    appId: config.public.FIREBASE_APP_ID,
  };

  // Prevent multiple app initializations
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

export const useFirebase = () => {
  const app = getSafeApp();
  if (!app) return { auth: null, db: null }; // Return nulls if on server

  return {
    auth: getAuth(app),
    db: getFirestore(app)
  };
};

// 2. Updated Helper: Always use the safe app instance
const getServices = () => {
  const app = getSafeApp();
  if (!app) throw new Error("Firebase cannot be accessed on the server.");
  return { auth: getAuth(app), db: getFirestore(app) };
};

export const signInUser = async (email: string, password: string) => {
  const { auth } = getServices();
  
  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return credentials;
  } catch (error: any) {
    const errorCode = error.code;
    console.error("Auth Error:", errorCode);
    
    // Map your error messages here...
    if (errorCode === "auth/invalid-api-key") return "System Config Error: Key Rejected";
    return "Login failed";
  }
};

export const initUser = async () => {
  if (process.server) return; // CRITICAL: Stop hydration mismatches

  const { auth, db } = getServices();
  const firebaseUser = useFirebaseUser();
  
  // Set initial state
  firebaseUser.value = auth.currentUser;

  onAuthStateChanged(auth, (user) => {
    firebaseUser.value = user;
    const userCookie = useCookie("userCookie");
    // @ts-ignore
    userCookie.value = user;

    $fetch("/api/auth", {
      method: "POST",
      body: { user },
    });
  });
};

// 3. Simplified Firestore Helper (Example of fixing the "Guessing" app issue)
export const getDocsFromFirestore = async (collectionName: string) => {
  try {
    const { db } = getServices(); // Use getServices to ensure the right app is used
    const q = query(collection(db, collectionName));
    const items: any[] = [];

    const res = await getDocs(q);
    res.forEach((doc) => {
      let newdoc = doc.data();
      newdoc.uid = doc.id;
      items.push(newdoc);
    });
    return items;
  } catch (error) {
    console.error('Firestore Error:', error);
    return [];
  }
};

// ... apply the "const { db } = getServices()" pattern to your other functions

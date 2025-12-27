import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, setDoc, 
  doc, query, onSnapshot, writeBatch, deleteDoc, updateDoc, 
  orderBy, where, limit, increment, type DocumentData, type Query 
} from "firebase/firestore";

// 1. Centralized "Safe" Initialization
// This ensures we never run Firebase on the server (solving Hydration errors)
// and never initialize the app twice (solving API Key errors).
const getSafeApp = () => {
  if (process.server) return null;
  const config = useRuntimeConfig();
  console.log("FIREBASE CONFIG CHECK:", config.public.FIREBASE_API_KEY);

  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY, 
    projectId: config.public.FIREBASE_PROJECT_ID,
    authDomain: `${config.public.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    appId: config.public.FIREBASE_APP_ID,
  };

  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Internal helper to get services with the correct app context
const getServices = () => {
  const app = getSafeApp();
  if (!app) throw new Error("Firebase cannot be initialized on the server.");

  const auth = getAuth(app);
  const db = getFirestore(app);
  // ADD THIS LOG TEMPORARILY:
  console.log("Current Auth User:", auth.currentUser?.email || "NOT LOGGED IN"); // temp
  
  return { auth, db };
};

// 2. Main Composable
export const useFirebase = () => {
  const app = getSafeApp();
  if (!app) return { auth: null, db: null };

  return {
    auth: getAuth(app),
    db: getFirestore(app)
  };
};

/* --- AUTHENTICATION FUNCTIONS --- */

export const createUser = async (email: string, password: string) => {
  const { auth } = getServices();
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signInUser = async (email: string, password: string) => {
  const { auth } = getServices();
  
  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return credentials;
  } catch (error: any) {
    const errorCode = error.code;
    console.error("Login Error:", errorCode);

    const errorMap: Record<string, string> = {
      "auth/user-not-found": "You are not authorised. Create a user in Firebase",
      "auth/wrong-password": "Wrong password",
      "auth/too-many-requests": "Too many requests",
      "auth/user-disabled": "User disabled",
      "auth/invalid-email": "Invalid email",
      "auth/invalid-credential": "Invalid credential",
      "auth/invalid-api-key": "Configuration Error: Check Vercel API Key"
    };

    return errorMap[errorCode] || "An unknown error occurred.";
  }
};

export const signOutUser = async () => {
  const { auth } = getServices();
  return await signOut(auth);
};

export const initUser = async () => {
  if (process.server) return; 

  const { auth } = getServices();
  const firebaseUser = useFirebaseUser();
  const userCookie = useCookie("userCookie");

  firebaseUser.value = auth.currentUser;

  onAuthStateChanged(auth, (user) => {
    firebaseUser.value = user;
    // @ts-ignore
    userCookie.value = user;

    $fetch("/api/auth", {
      method: "POST",
      body: { user },
    });
  });
};

/* --- FIRESTORE FUNCTIONS --- */

/*
export const addDocToFirestore = async (collectionName: string, data: any) => {
  const { db } = getServices();
  try {
    const docRef = collection(db, collectionName);
    return await addDoc(docRef, data);
  } catch (error) {
    console.error('Firestore Add Error:', error);
    return error;
  }
};
*/

export const addDocToFirestore = async (collectionName: string, data: any) => {
  const { db } = getServices();
  try {
    const docRef = collection(db, collectionName);
    
    // Convert Vue reactive object to plain JS object to ensure Firebase accepts it
    const plainData = JSON.parse(JSON.stringify(data));
    
    return await addDoc(docRef, plainData);
  } catch (error) {
    console.error('Firestore Add Error:', error);
    return error;
  }
};

export const getDocsFromFirestore = async (collectionName: string) => {
  try {
    const { db } = getServices();
    const items: any[] = [];
    const q = query(collection(db, collectionName));
    const res = await getDocs(q);
    
    res.forEach((doc) => {
      items.push({ ...doc.data(), uid: doc.id });
    });
    return items;
  } catch (error) {
    console.error('Firestore Get Error:', error);
    return [];
  }
};

export const getOrderedDocsFromFirestore = async (collectionName: string, order: string = "published_at", count?: number) => {
  try {
    const { db } = getServices();
    const items: any[] = [];
    let q: Query<DocumentData>;

    if (count) {
      q = query(collection(db, collectionName), orderBy(order, "desc"), limit(count));
    } else {
      q = query(collection(db, collectionName), orderBy(order, "desc"));
    }

    const res = await getDocs(q);
    res.forEach((doc) => {
      items.push({ ...doc.data(), uid: doc.id });
    });
    return items;
  } catch (error) {
    console.error('Firestore Ordered Error:', error);
    return [];
  }
};

export const getDocFromFirestore = async (collectionName: string, docId: string) => {
  try {
    const { db } = getServices();
    const docRef = doc(db, collectionName, docId);
    const res = await getDoc(docRef);
    return res.exists() ? res.data() : null;
  } catch (error) {
    console.error('Firestore Single Doc Error:', error);
    return null;
  }
};

export const setDocInFirestore = async (collectionName: string, uid: string, data: any) => {
  const { db } = getServices();
  try {
    return await setDoc(doc(db, collectionName, uid), data);
  } catch (error) {
    console.error('Firestore Set Error:', error);
    return error;
  }
};

export const updateDocInFirestore = async (collectionName: string, uid: string, data: any) => {
  const { db } = getServices();
  try {
    return await updateDoc(doc(db, collectionName, uid), data);
  } catch (error) {
    console.error('Firestore Update Error:', error);
    return error;
  }
};

export const deleteDocFromFirestore = async (collectionName: string, docId: string) => {
  const { db } = getServices();
  try {
    return await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error('Firestore Delete Error:', error);
    return error;
  }
};

export const batchWrite = async (collectionName: string, items: any[]) => {
  const { db } = getServices();
  const batch = writeBatch(db);
  items.forEach((item: any) => {
    const docRef = doc(collection(db, collectionName));
    batch.set(docRef, item);
  });
  await batch.commit();
};

export const incrementPageView = async (collectionName: string, slug: string) => {
  const { db } = getServices();
  const q = query(collection(db, collectionName), where("slug", "==", slug));
  const querySnapshot = await getDocs(q);
  
  querySnapshot.forEach(async (document) => {
    const docRef = doc(db, collectionName, document.id);
    await updateDoc(docRef, { views: increment(1) });
  });
};

// Fixed watchDb to prevent initialization loops
export const watchDb = (collectionName: string, callback: (items: any[]) => void) => {
  if (process.server) return () => {}; 

  const { db } = getServices();
  const q = query(collection(db, collectionName));
  
  return onSnapshot(q, (querySnapshot) => {
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), uid: doc.id });
    });
    callback(items);
  });
};

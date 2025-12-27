import { initializeApp } from "firebase/app";
import {
  getAuth,
} from "firebase/auth";
// import { getFirestore } from "firebase/firestore"

export default defineNuxtPlugin((nuxtApp) => {

  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY,
    projectId: config.public.FIREBASE_PROJECT_ID,
    authDomain: `${config.public.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    appId: config.public.FIREBASE_APP_ID,
  };

  // Diagnostic Log: This will show in your browser console
  console.log("Firebase Plugin Booting. Key present?", !!firebaseConfig.apiKey);

  try {
    // Prevent double initialization
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);

    // Provide to the app
    nuxtApp.vueApp.provide('auth', auth);
    nuxtApp.provide('auth', auth);
  } catch (error) {
    console.error("Firebase failed to initialize:", error);
    // We don't throw the error here so the rest of the app can still load
  }

  // initUser();
  
  const auth = getAuth();
  
  nuxtApp.vueApp.provide('auth', auth);
  nuxtApp.provide('auth', auth);
  
  
  // nuxtApp.vueApp.provide('db', db);
  // nuxtApp.provide('db', db);
});

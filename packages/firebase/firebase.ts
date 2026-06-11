import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

// ---------------------------------------------------------------------------
// Firebase project configuration
// All values are injected via environment variables — never hardcode secrets.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
};

// ---------------------------------------------------------------------------
// Singleton pattern — prevents re-initialisation in Next.js hot-reload
// ---------------------------------------------------------------------------
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ---------------------------------------------------------------------------
// Service exports
// ---------------------------------------------------------------------------

/** Firestore database instance */
export const db: Firestore = getFirestore(app);

/** Firebase Auth instance */
export const auth: Auth = getAuth(app);

/** Firebase Cloud Storage instance */
export const storage: FirebaseStorage = getStorage(app);

/** Firebase Cloud Functions instance (region: asia-south1 for India) */
export const functions: Functions = getFunctions(app, "asia-south1");

export default app;

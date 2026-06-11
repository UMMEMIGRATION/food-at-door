import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForBuildTimePrerenderingOnly',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'food-at-door-dummy.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'food-at-door-dummy',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'food-at-door-dummy.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef0123456789abcdef',
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DUMMY12345',
}

// Prevent duplicate initialization in hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

export default app

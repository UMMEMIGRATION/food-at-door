import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './config'

/**
 * Sign in using Google Auth Popup.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

/**
 * Sign in using Email and Password.
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Create user with Email and Password.
 */
export async function signUpWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Send email verification.
 */
export async function sendVerification(user: FirebaseUser): Promise<void> {
  await sendEmailVerification(user)
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}


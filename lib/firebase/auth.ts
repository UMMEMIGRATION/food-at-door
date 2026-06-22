import {
  GoogleAuthProvider,
  signInWithCredential,
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
import { Capacitor } from '@capacitor/core'

/**
 * Sign in using Google Auth.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
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
  console.log("signUpWithEmail: Initiating createUserWithEmailAndPassword...");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  console.log("signUpWithEmail: createUserWithEmailAndPassword success. User UID:", userCredential.user.uid);
  
  // Log user details as requested
  console.log("userCredential.user.email:", userCredential.user.email);
  console.log("userCredential.user.uid:", userCredential.user.uid);
  console.log("userCredential.user.emailVerified:", userCredential.user.emailVerified);

  console.log("sendEmailVerification started");
  try {
    await sendEmailVerification(userCredential.user);
    console.log("sendEmailVerification success");
  } catch (error: any) {
    console.error("sendEmailVerification failed!");
    console.error("error.code:", error?.code);
    console.error("error.message:", error?.message);
    console.error("JSON.stringify(error):", JSON.stringify(error));
    console.error("Complete stack trace:", error?.stack);
    throw error;
  }
  return userCredential.user;
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


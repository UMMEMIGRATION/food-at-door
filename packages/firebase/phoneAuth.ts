import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhoneAuthState {
  confirmationResult: ConfirmationResult | null;
  verificationId: string | null;
  error: string | null;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// reCAPTCHA Verifier
// Must be called client-side only (not in SSR / Server Components).
// Call setupRecaptcha() before sendOtp().
// ---------------------------------------------------------------------------

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialises an invisible reCAPTCHA verifier and mounts it on the given
 * container element id.  Safe to call multiple times — clears existing verifier.
 *
 * @param containerId - id of an empty <div> in your JSX, e.g. "recaptcha-container"
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — OTP will be sent
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Please retry.");
      recaptchaVerifier = null;
    },
  });

  return recaptchaVerifier;
}

// ---------------------------------------------------------------------------
// Step 1 — Send OTP
// ---------------------------------------------------------------------------

/**
 * Sends a 6-digit OTP to the given phone number.
 * Phone must be in E.164 format: +919876543210
 *
 * @returns ConfirmationResult — pass this to verifyOtp()
 */
export async function sendOtp(
  phoneNumber: string,
  containerId: string = "recaptcha-container"
): Promise<ConfirmationResult> {
  const verifier = setupRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    verifier
  );
  return confirmationResult;
}

// ---------------------------------------------------------------------------
// Step 2 — Verify OTP
// ---------------------------------------------------------------------------

/**
 * Verifies the OTP entered by the user.
 * On success, creates or updates the user document in Firestore.
 *
 * @param confirmationResult - returned from sendOtp()
 * @param otp - 6-digit string entered by the user
 * @returns Firebase User object
 */
export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<User> {
  const credential = await confirmationResult.confirm(otp);
  const user = credential.user;

  // Upsert user document in Firestore on first login
  await upsertUserDocument(user);

  return user;
}

// ---------------------------------------------------------------------------
// Alternative: verify using verificationId (useful in React Native / Expo)
// ---------------------------------------------------------------------------

export async function verifyOtpWithId(
  verificationId: string,
  otp: string
): Promise<User> {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const result = await signInWithCredential(auth, credential);
  await upsertUserDocument(result.user);
  return result.user;
}

// ---------------------------------------------------------------------------
// Firestore — create user doc on first login
// ---------------------------------------------------------------------------

async function upsertUserDocument(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    // First-time login — create document
    await setDoc(userRef, {
      uid: user.uid,
      phone: user.phoneNumber,
      name: "",
      email: "",
      profileImage: "",
      addresses: [],
      defaultAddressIndex: -1,
      fcmToken: "",
      walletBalance: 0,
      totalOrders: 0,
      role: "customer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Returning user — update timestamp only
    await setDoc(
      userRef,
      { updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// Auth State Observer
// Use in a top-level provider (e.g. AuthContext)
// ---------------------------------------------------------------------------

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *   const unsub = onAuthChange((user) => setUser(user));
 *   return () => unsub();
 * }, []);
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

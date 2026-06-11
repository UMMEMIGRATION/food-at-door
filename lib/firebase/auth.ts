import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './config'

let confirmationResult: ConfirmationResult | null = null
let recaptchaVerifier: RecaptchaVerifier | null = null

/**
 * Initialise the invisible reCAPTCHA widget.
 * Call once when the OTP page mounts.
 */
export function initRecaptcha(containerId: string) {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  })
  return recaptchaVerifier
}

/**
 * Send OTP to the given Indian mobile number (+91XXXXXXXXXX).
 */
export async function sendOTP(phoneNumber: string): Promise<void> {
  if (!recaptchaVerifier) throw new Error('reCAPTCHA not initialised')
  const formattedPhone = phoneNumber.startsWith('+91')
    ? phoneNumber
    : `+91${phoneNumber}`
  confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
}

/**
 * Verify the OTP entered by the user.
 */
export async function verifyOTP(otp: string): Promise<FirebaseUser> {
  if (!confirmationResult) throw new Error('No OTP request in progress')
  const credential = await confirmationResult.confirm(otp)
  return credential.user
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
  confirmationResult = null
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

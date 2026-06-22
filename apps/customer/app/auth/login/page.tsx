"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import OtpVerification from "./OtpVerification";
import styles from "./login.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Validate Indian mobile number (10 digits, starts with 6–9) */
function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

/** Format raw 10-digit input with a space after the 5th digit for readability */
function formatDisplay(raw: string): string {
  const cleaned = raw.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────────
// reCAPTCHA setup — invisible, mounted on a hidden div
// ─────────────────────────────────────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null;

function setupRecaptcha(): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved automatically
    },
    "expired-callback": () => {
      recaptchaVerifier = null;
    },
  });

  return recaptchaVerifier;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [rawPhone, setRawPhone] = useState(""); // digits only, max 10
  const [displayPhone, setDisplayPhone] = useState(""); // formatted for input
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Clean up reCAPTCHA on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      recaptchaVerifier?.clear();
      recaptchaVerifier = null;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Handle phone input — strip non-digits, cap at 10
  // ─────────────────────────────────────────────────────────────────────────

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawPhone(raw);
    setDisplayPhone(formatDisplay(raw));
    setError("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Send OTP
  // ─────────────────────────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidIndianPhone(rawPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    try {
      const verifier = setupRecaptcha();
      const e164Phone = `+91${rawPhone}`;

      await verifier.render();
      const result = await signInWithPhoneNumber(auth, e164Phone, verifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err: unknown) {
      console.error("Failed to send OTP:", err);
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {}
        recaptchaVerifier = null;
      }
      const firebaseError = err as { code?: string };
      let message = "Failed to send OTP. Please try again.";

      if (firebaseError.code === "auth/invalid-phone-number") {
        message = "Invalid phone number format.";
      } else if (firebaseError.code === "auth/too-many-requests") {
        message = "Too many requests. Please wait a few minutes.";
      } else if (firebaseError.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded. Please try later.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — OTP verified → decide where to route
  // ─────────────────────────────────────────────────────────────────────────

  const handleVerifySuccess = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Check if user profile is complete (has a name set)
      const userRef = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists() && snapshot.data()?.name) {
        // Returning user — go to home
        router.replace("/");
      } else {
        // New user — go to profile setup
        router.replace("/auth/register");
      }
    } catch {
      // Fallback to home if Firestore check fails
      router.replace("/");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Resend OTP — re-triggers sendOtp for OtpVerification component
  // ─────────────────────────────────────────────────────────────────────────

  const handleResendOtp = async () => {
    setError("");
    try {
      const verifier = setupRecaptcha();
      await verifier.render();
      const result = await signInWithPhoneNumber(
        auth,
        `+91${rawPhone}`,
        verifier
      );
      setConfirmationResult(result);
    } catch (err: any) {
      console.error("Failed to resend OTP:", err);
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {}
        recaptchaVerifier = null;
      }
      throw err;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>
      {/* Hidden reCAPTCHA mount point — must exist in DOM before sendOtp */}
      <div id="recaptcha-container" aria-hidden="true" />

      <div className={styles.card} role="main">
        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.logoRing} aria-hidden="true">
            🍽️
          </div>
          <h1 className={styles.brandName}>Food At Door</h1>
          <p className={styles.brandTagline}>
            India&apos;s favourite food, delivered fast
          </p>
        </div>

        {/* ── Step: Phone number ────────────────────────────────────────── */}
        {step === "phone" && (
          <div className={styles.stepIn}>
            <h2 className={styles.heading}>Welcome back 👋</h2>
            <p className={styles.subheading}>
              Enter your mobile number to continue
            </p>

            <form
              onSubmit={handleSendOtp}
              className={styles.form}
              noValidate
              aria-label="Phone number login form"
            >
              <div>
                <label htmlFor="phone-input" className={styles.fieldLabel}>
                  Mobile Number
                </label>

                <div className={styles.phoneRow}>
                  {/* Country code badge */}
                  <div
                    className={styles.countryCode}
                    aria-label="Country code India +91"
                  >
                    <span className={styles.flag} aria-hidden="true">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  {/* Phone number input */}
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={displayPhone}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    className={styles.input}
                    aria-label="10-digit mobile number"
                    aria-required="true"
                    aria-describedby={error ? "phone-error" : undefined}
                    maxLength={11} // 10 digits + 1 space
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  id="phone-error"
                  className={styles.error}
                  role="alert"
                  aria-live="assertive"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Send OTP button */}
              <button
                id="send-otp-btn"
                type="submit"
                className={styles.btn}
                disabled={rawPhone.length !== 10 || loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    Get OTP
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className={styles.footerNote}>
              By continuing, you agree to our{" "}
              <Link href="/terms" tabIndex={0}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" tabIndex={0}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── Step: OTP verification ────────────────────────────────────── */}
        {step === "otp" && confirmationResult && (
          <OtpVerification
            phoneNumber={rawPhone}
            confirmationResult={confirmationResult}
            onSuccess={handleVerifySuccess}
            onBack={() => {
              setStep("phone");
              setError("");
              recaptchaVerifier?.clear();
              recaptchaVerifier = null;
            }}
            onResend={handleResendOtp}
          />
        )}
      </div>
    </main>
  );
}

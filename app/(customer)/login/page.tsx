"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Chrome, Mail, Lock, Phone, User } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { signInWithGoogle, signInWithEmail, getUser, createUser, updateUser, sendVerification, auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import styles from "./login.module.css";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);

  // Phone OTP States
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [fullName, setFullName] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const recaptchaVerifierRef = useRef<any>(null);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        console.log("[Phone Auth Debug] Clearing old RecaptchaVerifier instance.");
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        console.error("[Phone Auth Debug] Error clearing old verifier:", e);
      }
      recaptchaVerifierRef.current = null;
    }
    
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      console.warn("[Phone Auth Debug] recaptcha-container not found in DOM. Programmatically creating container...");
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    } else {
      console.log("[Phone Auth Debug] recaptcha-container found in DOM.");
    }

    try {
      console.log("[Phone Auth Debug] Initializing RecaptchaVerifier with auth instance:", auth);
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log("[Phone Auth Debug] reCAPTCHA solved automatically. Response Token:", response);
        },
        'expired-callback': () => {
          console.warn("[Phone Auth Debug] reCAPTCHA token expired. Resetting verifier.");
          recaptchaVerifierRef.current = null;
        }
      });
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (e: any) {
      console.error("[Phone Auth Debug] RecaptchaVerifier initialization failed with error:", e);
      return null;
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setOtpLoading(true);
    try {
      let formattedPhone = phoneOtp.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+91' + formattedPhone;
        }
      }
      console.log("[Phone Auth Debug] Initiating OTP send to phone:", formattedPhone);
      
      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        throw new Error("Could not initialize Recaptcha verifier. Please check container.");
      }

      console.log("[Phone Auth Debug] Rendering reCAPTCHA widget...");
      const widgetId = await appVerifier.render();
      console.log("[Phone Auth Debug] reCAPTCHA widget successfully rendered. Widget ID:", widgetId);

      console.log("[Phone Auth Debug] Calling signInWithPhoneNumber(auth, phone, appVerifier)...");
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      console.log("[Phone Auth Debug] signInWithPhoneNumber success. ConfirmationResult:", confirmation);
      
      setConfirmationResult(confirmation);
      setOtpStep('code');
    } catch (err: any) {
      console.error("[Phone Auth Debug] Detailed failure inside handleSendOTP:", {
        code: err.code,
        message: err.message,
        customData: err.customData,
        fullError: err
      });
      if (recaptchaVerifierRef.current) {
        try {
          console.log("[Phone Auth Debug] Clearing verifier on failure...");
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpLoading(true);
    console.log("[Phone Auth Debug] handleVerifyOTP started. Code entered:", verificationCode);
    try {
      if (!confirmationResult) {
        throw new Error("No active verification code found. Please send OTP first.");
      }
      
      console.log("[Phone Auth Debug] Firebase Auth currentUser BEFORE confirmation:", auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, phoneNumber: auth.currentUser.phoneNumber } : "null");
      console.log("[Phone Auth Debug] Calling confirmationResult.confirm(code)...");
      const credentialResult = await confirmationResult.confirm(verificationCode);
      console.log("[Phone Auth Debug] confirmationResult.confirm success. Credential retrieved. User Info:", credentialResult.user ? { uid: credentialResult.user.uid, phone: credentialResult.user.phoneNumber, displayName: credentialResult.user.displayName } : "null");
      
      const authenticatedUser = credentialResult.user;
      console.log("[Phone Auth Debug] Firebase Auth currentUser AFTER confirmation:", auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, phoneNumber: auth.currentUser.phoneNumber } : "null");
      console.log("[Phone Auth Debug] Authenticated user UID:", authenticatedUser.uid);
      
      const userDoc = await getUser(authenticatedUser.uid);
      console.log("[Phone Auth Debug] getDoc lookup success. Document exists:", !!userDoc);
      
      const phoneNum = authenticatedUser.phoneNumber || phoneOtp;

      if (!userDoc) {
        console.log("[Phone Auth Debug] User document not found. Auto-creating user profile...");
        await createUser(authenticatedUser.uid, {
          name: fullName || authenticatedUser.displayName || 'Customer',
          phone: phoneNum,
          email: authenticatedUser.email || '',
          photoURL: authenticatedUser.photoURL || '',
          role: "customer",
          addresses: []
        });
      } else {
        console.log("[Phone Auth Debug] User profile exists. Merging/updating phone number if needed...");
        await updateUser(authenticatedUser.uid, {
          phone: phoneNum
        });
      }
      
      setSuccess("Logged in successfully!");
      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (err: any) {
      console.error("[Phone Auth Debug] Detailed failure inside handleVerifyOTP:", {
        code: err.code,
        message: err.message,
        fullError: err
      });
      setError(err.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setOtpLoading(false);
    }
  };



  useEffect(() => {
    if (searchParams?.get("verified") === "false") {
      setError("Please verify your email address before logging in.");
    }
    if (searchParams?.get("method") === "phone") {
      setLoginMethod("phone");
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError("Please enter your email and password to resend the verification email.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const firebaseUser = await signInWithEmail(email, password);
      console.log("Sending verification email...");
      await sendVerification(firebaseUser);
      console.log("Verification email sent.");
      setSuccess("Verification email sent. Please check inbox and spam folder.");
    } catch (err: any) {
      console.error("[Auth Error] Failed to resend verification:", err);
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setUnverifiedUser(null);
    try {
      const firebaseUser = await signInWithEmail(email, password);
      
      if (!firebaseUser.emailVerified && !firebaseUser.email?.endsWith("@example.com")) {
        console.log("[Auth Warning] User is unverified, but allowing login temporarily for local testing.");
        setUnverifiedUser(firebaseUser);
        // Temporarily bypassed for local testing: do not return early
      }

      // Sync user profile to Firestore if missing
      const userDoc = await getUser(firebaseUser.uid);
      if (!userDoc) {
        await createUser(firebaseUser.uid, {
          name: firebaseUser.displayName || email.split("@")[0],
          phone: firebaseUser.phoneNumber || "",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          role: "customer",
          addresses: []
        });
      }

      setSuccess("Logged in successfully!");
      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {


      const firebaseUser = await signInWithGoogle();
      
      const userDoc = await getUser(firebaseUser.uid);
      if (!userDoc) {
        await createUser(firebaseUser.uid, {
          name: firebaseUser.displayName || "Customer",
          phone: firebaseUser.phoneNumber || "",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          role: "customer",
          addresses: []
        });
      }
      
      setSuccess("🎉 Logged in successfully!");
      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (err: any) {
      console.error("[Auth Diagnostics] Google Sign-In failure:", err);
      
      let message = "Failed to sign in with Google. Please try again.";
      if (err.code === "auth/unauthorized-domain") {
        message = "Unauthorized Domain: Please verify configuration in Firebase settings.";
      } else if (err.code === "auth/popup-closed-by-user") {
        message = "Google sign-in popup was closed before completion.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err; // Do not hide exceptions
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card} role="main">
        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.logoRing} aria-hidden="true">
            🍽️
          </div>
          <h1 className={styles.brandName}>Food At Door</h1>
          <p className={styles.brandTagline}>
            India&apos;s favourite food, delivered fast
          </p>
        </div>

        <div className={styles.stepIn}>
          <h2 className={styles.heading}>Welcome 👋</h2>
          <p className={styles.subheading}>
            Sign in to access your dashboard, track orders, and configure saved addresses.
          </p>

          {/* Toggle Tab between Email and Phone OTP */}
          {otpStep === "phone" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "rgba(255, 255, 255, 0.03)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <button
                type="button"
                onClick={() => { setError(""); setSuccess(""); setLoginMethod("email"); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: loginMethod === "email" ? "linear-gradient(135deg, #FF6B35, #FF8C55)" : "transparent",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => { setError(""); setSuccess(""); setLoginMethod("phone"); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: loginMethod === "phone" ? "linear-gradient(135deg, #FF6B35, #FF8C55)" : "transparent",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Mobile Number (OTP)
              </button>
            </div>
          )}

          {error && (
            <div className={styles.error} role="alert" style={{ marginBottom: "16px" }}>
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

          {success && (
            <div className={styles.successIcon} style={{ fontSize: "14px", padding: "12px", borderRadius: "10px", width: "100%", height: "auto", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#A7F3D0", marginBottom: "16px" }}>
              {success}
            </div>
          )}

          {loginMethod === "email" ? (
            <form onSubmit={handleEmailLogin} className={styles.form} style={{ marginBottom: "20px" }}>
              <div>
                <label className={styles.fieldLabel}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className={styles.fieldLabel}>Password</label>
                  <Link href="/forgot-password" className={styles.resendBtn} style={{ fontSize: "12px", marginBottom: "8px" }}>
                    Forgot?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : "Sign In"}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                className={styles.btnGhost}
                style={{ width: "100%", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                disabled={loading}
              >
                Resend Verification Email
              </button>
            </form>
          ) : (
            // Phone OTP Login Form
            <div>
              {otpStep === "phone" ? (
                <form onSubmit={handleSendOTP} className={styles.form} style={{ marginBottom: "20px" }}>
                  <div>
                    <label className={styles.fieldLabel}>Full Name (Optional for existing)</label>
                    <div style={{ position: "relative" }}>
                      <User size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={styles.input}
                        style={{ paddingLeft: "42px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={styles.fieldLabel}>Mobile Number</label>
                    <div className={styles.phoneRow}>
                      <div className={styles.countryCode}>
                        <span className={styles.flag}>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <div style={{ position: "relative", flex: 1 }}>
                        <Phone size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          className={styles.input}
                          style={{ paddingLeft: "42px" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={styles.btn} disabled={otpLoading}>
                    {otpLoading ? <span className={styles.spinner} /> : "Send OTP Verification"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className={styles.form} style={{ marginBottom: "20px" }}>
                  <button type="button" onClick={() => setOtpStep("phone")} className={styles.backBtn}>
                    ← Change Phone Number
                  </button>

                  <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "12px", lineHeight: "1.5" }}>
                    We have sent a 6-digit OTP code to the number <span style={{ color: "#FF8C55", fontWeight: "600" }}>{phoneOtp}</span>.
                  </p>

                  <div>
                    <label className={styles.fieldLabel}>Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className={styles.input}
                      style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px" }}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.btn} disabled={otpLoading}>
                    {otpLoading ? <span className={styles.spinner} /> : "Verify & Login"}
                  </button>

                  <button type="button" onClick={() => handleSendOTP()} className={styles.btnGhost} style={{ marginTop: "12px" }} disabled={otpLoading}>
                    Resend OTP Code
                  </button>
                </form>
              )}
            </div>
          )}

          {otpStep === "phone" && (
            <>
              <div className={styles.divider}>
                <span className={styles.dividerText}>or continue with</span>
              </div>

              <button
                onClick={handleGoogleLogin}
                className={styles.btnGhost}
                disabled={loading || otpLoading}
                style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "center", width: "100%", marginTop: "12px" }}
              >
                <Chrome size={18} />
                <span>Continue with Google</span>
              </button>

              <p className={styles.footerNote} style={{ marginTop: "20px" }}>
                Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
              </p>
            </>
          )}

          {/* Hidden Recaptcha Container */}
          <div id="recaptcha-container"></div>
        </div>

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
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0F172A", color: "#F8FAFC" }}>
        Loading login form...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

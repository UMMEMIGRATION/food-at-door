"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Mail, Lock } from "lucide-react";
import { signInWithGoogle, signInWithEmail, getUser, createUser } from "@/lib/firebase";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (searchParams?.get("verified") === "false") {
      setError("Please verify your email address before logging in.");
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const firebaseUser = await signInWithEmail(email, password);
      
      if (!firebaseUser.emailVerified && !firebaseUser.email?.endsWith("@example.com")) {
        setError("Your email address is not verified yet. Please check your inbox.");
        // Sign out to prevent active unverified session
        setLoading(false);
        return;
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
            Hyderabad&apos;s favourite food, delivered fast
          </p>
        </div>

        <div className={styles.stepIn}>
          <h2 className={styles.heading}>Welcome 👋</h2>
          <p className={styles.subheading}>
            Sign in to access your dashboard, track orders, and configure saved addresses.
          </p>

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
            <div className={styles.successIcon} style={{ fontSize: "14px", padding: "12px", borderRadius: "10px", width: "100%", height: "auto", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#A7F3D0" }}>
              {success}
            </div>
          )}

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
                <a href="/forgot-password" className={styles.resendBtn} style={{ fontSize: "12px", marginBottom: "8px" }}>
                  Forgot?
                </a>
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
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>or continue with</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className={styles.btnGhost}
            disabled={loading}
            style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "center", width: "100%", marginTop: "12px" }}
          >
            <Chrome size={18} />
            <span>Continue with Google</span>
          </button>

          <p className={styles.footerNote} style={{ marginTop: "20px" }}>
            Don&apos;t have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>

        <p className={styles.footerNote}>
          By continuing, you agree to our{" "}
          <a href="/terms" tabIndex={0}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" tabIndex={0}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}

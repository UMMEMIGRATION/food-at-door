"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Chrome } from "lucide-react";
import { auth, signInWithGoogle, getUser, createUser } from "@/lib/firebase";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("[Auth Diagnostics] Initializing Google Sign-In Popup...");
      const firebaseUser = await signInWithGoogle();
      
      console.log("[Auth Diagnostics] Google login success. UID:", firebaseUser.uid);
      
      // Check Firestore doc
      const userDoc = await getUser(firebaseUser.uid);
      if (!userDoc) {
        console.log("[Auth Diagnostics] User document not found. Seeding new Firestore record...");
        await createUser(firebaseUser.uid, {
          name: firebaseUser.displayName || "Customer",
          phone: firebaseUser.phoneNumber || "",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          role: "customer",
          addresses: []
        });
        console.log("[Auth Diagnostics] Seeding complete.");
      } else {
        console.log("[Auth Diagnostics] Returning user record found in Firestore.");
      }
      
      alert("🎉 Logged in successfully!");
      router.replace("/");
    } catch (err: any) {
      console.error("[Auth Diagnostics] Google Sign-In failure:", err);
      let message = "Failed to sign in with Google. Please try again.";
      if (err.code === "auth/unauthorized-domain") {
        message = "Unauthorized Domain: Please verify that 'food-at-door.vercel.app' is added to Firebase Authentication > Settings > Authorized Domains.";
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
            India&apos;s favourite food, delivered fast
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

          <button
            onClick={handleGoogleLogin}
            className={styles.btn}
            disabled={loading}
            aria-busy={loading}
            style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" }}
          >
            {loading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <Chrome size={18} />
                <span>Continue with Google</span>
              </>
            )}
          </button>
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

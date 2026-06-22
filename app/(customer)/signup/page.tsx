"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { createUser, firebaseApp } from "@/lib/firebase";
import { auth } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import styles from "../login/login.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");


    let userCredential = null;

    try {
      console.log("Initiating createUserWithEmailAndPassword...");
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      

    } catch (createErr: any) {
      console.error("[Diagnostics] createUserWithEmailAndPassword failed:", createErr);
      setError(`Create User Failure: ${createErr.message || createErr}`);
      setLoading(false);
      return;
    }

    try {
      console.log("sendEmailVerification started");
      await sendEmailVerification(userCredential.user);
    } catch (sendErr: any) {
      console.error("sendEmailVerification failed!", sendErr);
      setError(`Verification Send Failure: ${sendErr.message || sendErr}`);
      setLoading(false);
      return;
    }

    try {
      // Create user profile in Firestore
      await createUser(userCredential.user.uid, {
        name,
        phone: "",
        email: userCredential.user.email || email,
        photoURL: "",
        role: "customer",
        addresses: []
      });

      setSuccess("Verification email sent. Please check inbox and spam folder.");
      setTimeout(() => {
        router.replace("/login");
      }, 4000);
    } catch (err: any) {
      console.error("[Auth Error] Profile setup failure:", err);
      setError(err.message || "Failed to finalize account. Please try again.");
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
          <h2 className={styles.heading}>Create Account 🚀</h2>
          <p className={styles.subheading}>
            Sign up to order delicious meals and track deliveries.
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

 <form onSubmit={handleSignUp} className={styles.form} style={{ marginBottom: "20px" }}>
            <div>
              <label className={styles.fieldLabel}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  style={{ paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>

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
              <label className={styles.fieldLabel}>Password</label>
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

            <div>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  style={{ paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Create Account"}
            </button>
          </form>

          <p className={styles.footerNote} style={{ marginTop: "20px" }}>
            Already have an account? <Link href="/login">Sign In</Link>
          </p>
          <p className={styles.footerNote} style={{ marginTop: "12px" }}>
            Or register instantly using <Link href="/login?method=phone" style={{ fontWeight: "600" }}>Mobile Number (OTP)</Link>
          </p>
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

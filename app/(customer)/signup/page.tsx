"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Lock, Phone } from "lucide-react";
import { signUpWithEmail, sendVerification, createUser } from "@/lib/firebase";
import styles from "./login.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in Name, Email, and Password.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const firebaseUser = await signUpWithEmail(email, password);
      
      await createUser(firebaseUser.uid, {
        name,
        phone: phoneNumber || "",
        phoneNumber: phoneNumber || "",
        email: firebaseUser.email || email,
        photoURL: "",
        role: "customer",
        addresses: []
      });

      await sendVerification(firebaseUser);

      setSuccess("Account created successfully! Verification email has been sent. Please check your inbox before logging in.");
      
      setTimeout(() => {
        router.replace("/login?verified=false");
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card} role="main">
        {/* Back button */}
        <button onClick={() => router.push("/login")} className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </button>

        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.logoRing} aria-hidden="true">
            🍽️
          </div>
          <h1 className={styles.brandName}>Create Account</h1>
          <p className={styles.brandTagline}>Join Food At Door today</p>
        </div>

        <div className={styles.stepIn}>
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
            <div className={styles.successIcon} style={{ fontSize: "14px", padding: "16px", borderRadius: "10px", width: "100%", height: "auto", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#A7F3D0", lineHeight: "1.5" }}>
              {success}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSignup} className={styles.form}>
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
                <label className={styles.fieldLabel}>Phone Number (Optional)</label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", left: "14px", top: "16px", color: "#6B7280" }} />
                  <input
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={styles.input}
                    style={{ paddingLeft: "42px" }}
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

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : "Sign Up"}
              </button>
            </form>
          )}

          <p className={styles.footerNote} style={{ marginTop: "24px" }}>
            Already have an account? <a href="/login">Sign In</a>
          </p>
        </div>
      </div>
    </main>
  );
}

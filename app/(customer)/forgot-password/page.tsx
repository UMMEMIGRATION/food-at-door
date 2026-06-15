"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { sendPasswordReset } from "@/lib/firebase";
import styles from "./login.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendPasswordReset(email);
      setSuccess("If that email is registered, we have sent instructions to reset your password. Please check your inbox.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send password reset link. Please try again.");
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
            🔑
          </div>
          <h1 className={styles.brandName}>Reset Password</h1>
          <p className={styles.brandTagline}>We will email you a reset link</p>
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
            <form onSubmit={handleReset} className={styles.form}>
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

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className={styles.footerNote} style={{ marginTop: "24px" }}>
            Remember your password? <a href="/login">Sign In</a>
          </p>
        </div>
      </div>
    </main>
  );
}

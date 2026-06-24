"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Save } from "lucide-react";
import { auth, db, onAuthChange } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import styles from "../profile.module.css";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const pm = userData.paymentDetails || {};
            setUpiId(pm.upiId || "");
            setAccountHolderName(pm.accountHolderName || "");
            setAccountNumber(pm.accountNumber || "");
            setIfsc(pm.ifsc || "");
            setBankName(pm.bankName || "");
          }
        } catch (err: any) {
          console.error("Error loading payment details:", err);
          setError("Failed to load saved payment details.");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        paymentDetails: {
          upiId,
          accountHolderName,
          accountNumber,
          ifsc,
          bankName
        }
      });
      setSuccess("Payment details saved successfully!");
    } catch (err: any) {
      console.error("Error saving payment details:", err);
      setError(err.message || "Failed to save details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/profile")} 
          className={styles.backBtn}
          aria-label="Back to profile"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Payment Methods</h1>
      </header>

      <div className={styles.scrollBody} style={{ padding: "20px" }}>
        <section className={styles.userSection} style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#FF6B35" }}>
            <CreditCard size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#FFF", margin: 0 }}>UPI & Bank Details</h2>
          </div>

          {loading ? (
            <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>Loading details...</div>
          ) : (
            <form onSubmit={handleSave} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
              {success && (
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", fontSize: "14px" }}>
                  {success}
                </div>
              )}

              {error && (
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: "14px" }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>UPI ID</label>
                <input
                  type="text"
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.08)", margin: "12px 0", paddingTop: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#D1D5DB", marginBottom: "12px" }}>Bank Account Details</h3>
              </div>

              <div>
                <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Full name as in bank records"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>Account Number</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>IFSC Code</label>
                <input
                  type="text"
                  placeholder="SBIN0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>Bank Name</label>
                <input
                  type="text"
                  placeholder="State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={styles.saveBtn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: 600,
                  marginTop: "10px",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Saving..." : (
                  <>
                    <Save size={16} />
                    <span>Save Payment Details</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

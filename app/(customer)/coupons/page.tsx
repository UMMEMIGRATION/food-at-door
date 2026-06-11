"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Percent, Sparkles, AlertCircle } from "lucide-react";
import styles from "./coupons.module.css";

interface Coupon {
  code: string;
  title: string;
  desc: string;
  type: "discount" | "free_delivery" | "cashback";
}

const MOCK_COUPONS: Coupon[] = [
  {
    code: "FAD50",
    title: "50% OFF up to ₹100",
    desc: "Valid on orders above ₹150. Indian specials eligible.",
    type: "discount"
  },
  {
    code: "FREEDEL",
    title: "Free Delivery on orders",
    desc: "Valid on orders above ₹200. Madhapur locality only.",
    type: "free_delivery"
  },
  {
    code: "BAWARCHI80",
    title: "Flat ₹80 OFF at Bawarchi",
    desc: "Valid exclusively on Bawarchi Biryani products.",
    type: "discount"
  },
  {
    code: "FADCASH",
    title: "₹50 Paytm Cashback",
    desc: "Valid on payment via Paytm Wallet or UPI transactions.",
    type: "cashback"
  }
];

export default function CouponsPage() {
  const router = useRouter();
  
  const [typedCode, setTypedCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const handleApplyCoupon = (code: string) => {
    const codeClean = code.trim().toUpperCase();
    if (!codeClean) return;

    const matched = MOCK_COUPONS.find(c => c.code === codeClean);
    if (matched) {
      setAppliedCoupon(matched);
      setTypedCode(codeClean);
      alert(`🎉 Coupon "${codeClean}" applied successfully!`);
    } else {
      alert(`❌ Invalid coupon code. Try FAD50 or FREEDEL.`);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setTypedCode("");
    alert("ℹ️ Coupon removed.");
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.back()} 
          className={styles.backBtn}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Apply Coupon</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Manual Input Section */}
        <section className={styles.inputSection}>
          <input
            type="text"
            placeholder="Enter coupon code (e.g. FAD50)"
            value={typedCode}
            onChange={(e) => setTypedCode(e.target.value)}
            disabled={!!appliedCoupon}
            className={styles.inputField}
            style={{ textTransform: "uppercase" }}
          />
          {appliedCoupon ? (
            <button onClick={handleRemoveCoupon} className={styles.removeBtn}>
              Remove
            </button>
          ) : (
            <button onClick={() => handleApplyCoupon(typedCode)} className={styles.applyBtn}>
              Apply
            </button>
          )}
        </section>

        {/* Applied banner */}
        {appliedCoupon && (
          <div className={styles.appliedBanner}>
            <div className={styles.appliedText}>
              <span className={styles.appliedTitle}>Code Applied: {appliedCoupon.code}</span>
              <span className={styles.appliedDesc}>{appliedCoupon.title}</span>
            </div>
            <Ticket size={20} color="#10B981" />
          </div>
        )}

        {/* Available Coupons */}
        <section style={{ marginBottom: "28px" }}>
          <h2 className={styles.sectionTitle}>Available Coupons</h2>
          <div className={styles.couponList}>
            {MOCK_COUPONS.map((coupon) => (
              <div key={coupon.code} className={styles.couponCard}>
                <div className={styles.couponLeft}>
                  <span className={styles.promoBadge}>{coupon.code}</span>
                  <h3 className={styles.couponTitle}>{coupon.title}</h3>
                  <p className={styles.couponDesc}>{coupon.desc}</p>
                </div>
                {appliedCoupon?.code === coupon.code ? (
                  <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>Applied</span>
                ) : (
                  <button 
                    onClick={() => handleApplyCoupon(coupon.code)}
                    className={styles.actionLink}
                  >
                    Apply
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Offers */}
        <section>
          <h2 className={styles.sectionTitle}>Recommended Offers</h2>
          <div className={styles.couponCard} style={{ borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.04)" }}>
            <div className={styles.couponLeft} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ background: "rgba(255, 107, 53, 0.08)", padding: "10px", borderRadius: "10px" }}>
                <Percent size={18} color="#FF8C55" />
              </div>
              <div>
                <h3 className={styles.couponTitle} style={{ fontSize: "13px" }}>Payment Offers</h3>
                <p className={styles.couponDesc}>Save up to ₹150 with cred pay and simplified UPI.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

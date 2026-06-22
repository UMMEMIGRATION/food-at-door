"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  MapPin, 
  Utensils, 
  Home, 
  Navigation,
  Check
} from "lucide-react";
import styles from "./confirmation.module.css";

export default function OrderConfirmationPage() {
  const router = useRouter();
  
  // ── States ─────────────────────────────────────────────────────────────────
  const [orderId, setOrderId] = useState("#FAD-xxxx-xxxx");

  // Generate a random order ID on mount
  useEffect(() => {
    const segment1 = Math.floor(1000 + Math.random() * 9000);
    const segment2 = Math.floor(1000 + Math.random() * 9000);
    setOrderId(`#FAD-${segment1}-${segment2}`);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.scrollBody}>
        {/* ── Success Animation Card ─────────────────────────────────────────── */}
        <section className={styles.successCard}>
          <div className={styles.checkmarkWrap}>
            <div className={styles.checkmark}>
              <Check size={38} strokeWidth={3} />
            </div>
            <div className={styles.pulseRing} />
          </div>
          <h2 className={styles.heading}>Order Confirmed!</h2>
          <p className={styles.subheading}>Your food is being prepared with care</p>
          <span className={styles.orderId} aria-label={`Order ID: ${orderId}`}>{orderId}</span>
        </section>

        {/* ── Order details block ────────────────────────────────────────────── */}
        <section className={styles.infoSection} aria-label="Delivery Details">
          {/* Restaurant */}
          <div className={styles.sectionItem}>
            <div className={styles.iconBox}>
              <Utensils size={16} />
            </div>
            <div className={styles.itemContent}>
              <span className={styles.itemLabel}>Restaurant</span>
              <h3 className={styles.itemValue}>Paradise Biryani</h3>
              <p className={styles.itemSubtext}>Madhapur Branch</p>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Time */}
          <div className={styles.sectionItem}>
            <div className={styles.iconBox}>
              <Clock size={16} />
            </div>
            <div className={styles.itemContent}>
              <span className={styles.itemLabel}>Estimated Delivery</span>
              <h3 className={styles.itemValue}>30 - 40 Mins</h3>
              <p className={styles.itemSubtext}>Arriving by 4:45 PM</p>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Address */}
          <div className={styles.sectionItem}>
            <div className={styles.iconBox}>
              <MapPin size={16} />
            </div>
            <div className={styles.itemContent}>
              <span className={styles.itemLabel}>Deliver To</span>
              <h3 className={styles.itemValue}>Home (Flat 304)</h3>
              <p className={styles.itemSubtext}>Srinivasa Heights, Madhapur, Hyderabad</p>
            </div>
          </div>
        </section>

        {/* ── Itemized Order Summary ─────────────────────────────────────────── */}
        <section className={styles.infoSection} aria-labelledby="summary-heading">
          <h2 id="summary-heading" className={styles.summaryTitle}>Order Summary</h2>
          
          <div className={styles.summaryRow}>
            <div>
              <span className={styles.summaryQty}>2x</span>
              <span>Special Chicken Biryani</span>
            </div>
            <span className={styles.summaryPrice}>₹760</span>
          </div>

          <div className={styles.summaryRow}>
            <div>
              <span className={styles.summaryQty}>1x</span>
              <span>Niloufer Special Tea</span>
            </div>
            <span className={styles.summaryPrice}>₹50</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.paymentRow} style={{ fontSize: "11px", marginBottom: "4px" }}>
            <span>Item Subtotal</span>
            <span>₹810</span>
          </div>

          <div className={styles.paymentRow} style={{ fontSize: "11px", marginBottom: "4px" }}>
            <span>Delivery Fee</span>
            <span style={{ color: "#10B981", fontWeight: 600 }}>FREE</span>
          </div>

          <div className={styles.paymentRow} style={{ fontSize: "11px", marginBottom: "4px" }}>
            <span>Taxes & charges</span>
            <span>₹56</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span>Total Paid</span>
            <span className={styles.totalValue}>₹866</span>
          </div>
        </section>

        {/* ── Action Buttons ─────────────────────────────────────────────────── */}
        <div className={styles.btnGroup}>
          <button 
            onClick={() => router.push(`/orders/track?id=${orderId.replace('#', '')}`)} 
            className={styles.primaryBtn}
            aria-label="Track order live on map"
          >
            <Navigation size={16} fill="#fff" />
            <span>Track Order</span>
          </button>
          
          <button 
            onClick={() => router.push("/")} 
            className={styles.secondaryBtn}
            aria-label="Go back to home screen"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </main>
  );
}

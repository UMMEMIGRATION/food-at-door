"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Phone, 
  HelpCircle, 
  Home, 
  MapPin, 
  Check, 
  Clock, 
  ChevronRight,
  Info
} from "lucide-react";
import styles from "./tracking.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StepInfo {
  title: string;
  desc: string;
  time?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Format order ID based on route params or use fallback
  const orderId = useMemo(() => {
    const rawId = params?.id || "8409-1834";
    return rawId.startsWith("FAD-") ? `#${rawId}` : `#FAD-${rawId}`;
  }, [params?.id]);

  // ── Simulator & Timeline State ─────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(2); // Start at "Preparing" for demonstration

  const timelineSteps: StepInfo[] = [
    { title: "Order Placed", desc: "Order details received by restaurant", time: "04:12 PM" },
    { title: "Order Confirmed", desc: "Restaurant has accepted and verified your order", time: "04:15 PM" },
    { title: "Preparing Food", desc: "Our chef is preparing your fresh meal", time: "04:18 PM" },
    { title: "Out for Delivery", desc: "Ramesh is bringing your food to your doorstep", time: "04:32 PM" },
    { title: "Delivered", desc: "Enjoy your fresh and delicious meal!", time: "04:40 PM" }
  ];

  // ── Status Computed Details ───────────────────────────────────────────────
  const statusHeadlineText = useMemo(() => {
    switch (activeStep) {
      case 0: return "Order Placed";
      case 1: return "Order Confirmed";
      case 2: return "Preparing your food";
      case 3: return "Out for Delivery";
      case 4: return "Order Delivered";
      default: return "Order Status";
    }
  }, [activeStep]);

  const liveStatusText = useMemo(() => {
    switch (activeStep) {
      case 0: return "Waiting for restaurant accept confirmation...";
      case 1: return "Restaurant has accepted your order and is starting preparation.";
      case 2: return "Our kitchen crew is assembling your fresh Hyderabadi specials.";
      case 3: return "Ramesh Kumar has picked up your food and is riding to your location.";
      case 4: return "Order handed over to customer. Bon appétit!";
      default: return "";
    }
  }, [activeStep]);

  const etaDisplay = useMemo(() => {
    switch (activeStep) {
      case 0: return "35 mins";
      case 1: return "30 mins";
      case 2: return "20 mins";
      case 3: return "8 mins";
      case 4: return "Delivered";
      default: return "--";
    }
  }, [activeStep]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    setActiveStep((prev) => (prev < 4 ? prev + 1 : 0)); // Cycles through steps
  };

  const handleCallDriver = () => {
    alert("📞 Initiating call to Delivery Agent: Ramesh Kumar (+91 98765 43210)");
  };

  const handleContactSupport = () => {
    alert("💬 Initiating live chat support connection for Order " + orderId);
  };

  return (
    <main className={styles.page}>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/")} 
          className={styles.backBtn}
          aria-label="Back to customer home"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Order Tracking</h1>
      </header>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        
        {/* ── Simulated Status Controller ─────────────────────────────────────── */}
        <section className={styles.simulatorBar}>
          <span className={styles.simLabel}>Mock Order Cycle Simulator</span>
          <button onClick={handleNextStep} className={styles.simBtn}>
            {activeStep === 4 ? "Restart Cycle" : "Next Step ⚡"}
          </button>
        </section>

        {/* ── Status Header Card ─────────────────────────────────────────────── */}
        <section className={styles.card} aria-label="Current Order Status">
          <div className={styles.statusHeadline}>
            {activeStep < 4 && <span className={styles.statusPulse} />}
            <span>{statusHeadlineText}</span>
          </div>
          <p className={styles.stepDescActive} style={{ fontSize: "13px", lineHeight: "1.5", marginTop: "4px" }}>
            {liveStatusText}
          </p>

          <div className={styles.etaRow}>
            <span className={styles.etaLabel}>Estimated Delivery</span>
            <span className={styles.etaValue}>{etaDisplay}</span>
          </div>
        </section>

        {/* ── Map Placeholder ────────────────────────────────────────────────── */}
        <section className={styles.mapCard} aria-label="Live Tracking Map">
          <div className={styles.mapGrid}>
            <div className={styles.gridLineHorizontal} style={{ top: "30%" }}></div>
            <div className={styles.gridLineHorizontal} style={{ top: "60%" }}></div>
            <div className={styles.gridLineVertical} style={{ left: "30%" }}></div>
            <div className={styles.gridLineVertical} style={{ left: "60%" }}></div>
            
            {/* Dashed route path */}
            <svg className={styles.mapRouteSvg}>
              <path d="M 60 160 Q 180 80 320 60" fill="none" stroke="#FF6B35" strokeWidth="3" strokeDasharray="6,6" className={styles.mapRoutePath} />
            </svg>

            {/* Icons */}
            <div className={`${styles.mapPinIcon} ${styles.pinRestaurant}`} style={{ bottom: "25%", left: "15%" }}>
              <div className={styles.pinLabelText}>Paradise Biryani</div>
              🍳
            </div>
            
            {activeStep === 3 && (
              <div className={`${styles.mapPinIcon} ${styles.pinRider}`} style={{ top: "35%", left: "45%" }}>
                <div className={styles.pinLabelText}>Ramesh (Rider)</div>
                🚴
              </div>
            )}

            <div className={`${styles.mapPinIcon} ${styles.pinUser}`} style={{ top: "15%", right: "15%" }}>
              <div className={styles.pinLabelText}>Your Home</div>
              📍
            </div>
          </div>
          <div className={styles.mapFooter}>
            <MapPin size={12} color="#FF8C55" />
            <span className={styles.mapStatusFooter}>GPS Live Tracking Active</span>
          </div>
        </section>

        {/* ── Stepper Status Timeline ────────────────────────────────────────── */}
        <section className={styles.card} aria-label="Delivery progress timeline">
          <div className={styles.timeline}>
            {timelineSteps.map((step, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              
              return (
                <div 
                  key={index} 
                  className={`${styles.step} ${isCompleted ? styles.stepCompleted : ""}`}
                >
                  {/* Timeline icon indicator */}
                  <div className={`
                    ${styles.stepIcon} 
                    ${isCompleted ? styles.stepIconCompleted : ""}
                    ${isActive ? styles.stepIconActive : ""}
                  `}>
                    {isCompleted ? (
                      <Check size={11} strokeWidth={3} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Stepper info details */}
                  <div className={styles.stepContent}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 className={`
                        ${styles.stepTitle}
                        ${isActive ? styles.stepTitleActive : ""}
                        ${isCompleted ? styles.stepTitleCompleted : ""}
                      `}>
                        {step.title}
                      </h3>
                      {step.time && (isCompleted || isActive) && (
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>{step.time}</span>
                      )}
                    </div>
                    <p className={isActive ? styles.stepDescActive : styles.stepDesc}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Driver Information Card (visible during prep and transit) ──────── */}
        {activeStep >= 2 && (
          <section className={styles.card} aria-label="Delivery Agent Information">
            <div className={styles.driverHeader}>
              <div className={styles.driverAvatar} role="img" aria-label="Ramesh Kumar profile avatar">🚴</div>
              <div className={styles.driverDetails}>
                <span className={styles.driverLabel}>Your Delivery Partner</span>
                <h3 className={styles.driverName}>Ramesh Kumar</h3>
                <span className={styles.driverPhone}>Riding a Splendor Plus</span>
              </div>
              {activeStep === 3 && (
                <span style={{ fontSize: "10px", color: "#FF8C55", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                  <span className={styles.statusPulse} style={{ width: "6px", height: "6px" }} />
                  Nearby
                </span>
              )}
            </div>
          </section>
        )}

        {/* ── Restaurant & Order Details ────────────────────────────────────── */}
        <section className={styles.card} aria-labelledby="restaurant-heading">
          <div className={styles.driverHeader} style={{ marginBottom: "14px" }}>
            <div className={styles.driverAvatar} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "18px" }}>🍽️</div>
            <div className={styles.driverDetails}>
              <span className={styles.driverLabel}>Ordering From</span>
              <h3 id="restaurant-heading" className={styles.driverName}>Paradise Biryani</h3>
              <p className={styles.driverPhone}>Madhapur, Hyderabad</p>
            </div>
          </div>

          <h2 className={styles.summaryHeader}>Receipt Summary</h2>
          
          <div className={styles.summaryRow}>
            <div>
              <span className={styles.summaryQty}>2x</span>
              <span className={styles.summaryPrice}>Special Chicken Biryani</span>
            </div>
            <span className={styles.summaryPrice}>₹760</span>
          </div>

          <div className={styles.summaryRow}>
            <div>
              <span className={styles.summaryQty}>1x</span>
              <span className={styles.summaryPrice}>Niloufer Special Tea</span>
            </div>
            <span className={styles.summaryPrice}>₹50</span>
          </div>

          <div className={styles.summaryTotalRow}>
            <span>Grand Total Paid</span>
            <span className={styles.summaryTotalValue}>₹866</span>
          </div>
        </section>

        {/* ── Action Buttons Block ────────────────────────────────────────────── */}
        <div className={styles.btnGroup}>
          <div className={styles.rowButtons}>
            <button 
              onClick={handleCallDriver} 
              disabled={activeStep < 2 || activeStep === 4}
              className={styles.primaryBtn}
              style={{ opacity: (activeStep < 2 || activeStep === 4) ? 0.5 : 1 }}
            >
              <Phone size={14} />
              <span>Call Partner</span>
            </button>
            <button onClick={handleContactSupport} className={styles.secondaryBtn}>
              <HelpCircle size={14} />
              <span>Support</span>
            </button>
          </div>

          {activeStep < 3 && (
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to cancel this order?")) {
                  alert("❌ Order cancelled successfully. Refund is being processed.");
                  router.push("/orders");
                }
              }} 
              className={styles.cancelBtn}
            >
              Cancel Order
            </button>
          )}

          <button onClick={() => router.push("/")} className={styles.homeBtn}>
            <Home size={14} />
            <span>Go to Homepage</span>
          </button>
        </div>

      </div>
    </main>
  );
}

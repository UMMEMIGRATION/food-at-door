"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

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
  const orderDocId = params?.id;
  
  // Format order ID based on route params or use fallback
  const orderId = useMemo(() => {
    const rawId = orderDocId || "8409-1834";
    return rawId.startsWith("FAD-") ? `#${rawId}` : `#FAD-${rawId}`;
  }, [orderDocId]);

  // Diagnostics States
  const [currentUrl, setCurrentUrl] = useState("");
  const [searchParamsVal, setSearchParamsVal] = useState("");
  const [queryResult, setQueryResult] = useState("Snapshot Pending");
  const [queryError, setQueryError] = useState("");

  const [dbOrder, setDbOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLoc, setDriverLoc] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      setSearchParamsVal(window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!orderDocId) {
      setQueryResult("No order ID provided in params");
      setLoading(false);
      return;
    }
    setQueryResult("Querying Firestore for document ID: " + orderDocId + "...");
    const unsub = onSnapshot(doc(db, "orders", orderDocId), (docSnap) => {
      if (docSnap.exists()) {
        setDbOrder(docSnap.data());
        setQueryResult(`Document exists. Status: "${docSnap.data().status}"`);
      } else {
        setQueryResult("Document does NOT exist in orders collection.");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading order tracker:", error);
      setQueryResult("Query Error");
      setQueryError(`[${error.code || "unknown"}] ${error.message || error}`);
      setLoading(false);
    });
    return () => unsub();
  }, [orderDocId]);

  useEffect(() => {
    const driverId = dbOrder?.driverId;
    if (!driverId) return;

    const unsub = onSnapshot(doc(db, "driverLocations", driverId), (docSnap) => {
      if (docSnap.exists()) {
        setDriverLoc(docSnap.data());
      }
    }, (error) => {
      console.error("Error loading driver location:", error);
    });
    return () => unsub();
  }, [dbOrder?.driverId]);

  // Interpolated visual position for the driver pin along the route
  const riderVisualPosition = useMemo(() => {
    if (!driverLoc?.latitude || !driverLoc?.longitude) {
      return { top: "35%", left: "45%" }; // Default fallback
    }

    // Default Hyderabad coordinates for Restaurant and User if not available
    const restaurantLat = dbOrder?.restaurant?.lat || 17.4483;
    const restaurantLng = dbOrder?.restaurant?.lng || 78.3915;
    const userLat = dbOrder?.deliveryAddress?.lat || 17.4565;
    const userLng = dbOrder?.deliveryAddress?.lng || 78.4123;

    // Vector calculations for projection
    const abX = userLat - restaurantLat;
    const abY = userLng - restaurantLng;
    const apX = driverLoc.latitude - restaurantLat;
    const apY = driverLoc.longitude - restaurantLng;

    const dot = apX * abX + apY * abY;
    const lenSq = abX * abX + abY * abY;
    
    let t = lenSq > 0 ? dot / lenSq : 0.5;
    // Clamp t between 0 and 1
    t = Math.max(0, Math.min(1, t));

    // Map t from Restaurant (top: 75%, left: 15%) to User (top: 15%, left: 85%)
    const top = 75 - t * 60;
    const left = 15 + t * 70;

    return { top: `${top}%`, left: `${left}%` };
  }, [driverLoc, dbOrder]);

  const activeStep = useMemo(() => {
    if (!dbOrder) return 0;
    const status = dbOrder.status;
    if (status === "pending") return 0;
    if (status === "accepted" || status === "confirmed") return 1;
    if (status === "preparing" || status === "ready" || status === "ready_for_pickup" || status === "arrived_restaurant") return 2;
    if (status === "picked_up" || status === "out_for_delivery" || status === "on_the_way" || status === "arrived_customer") return 3;
    if (status === "delivered") return 4;
    return 0;
  }, [dbOrder]);

  const orderTimeStr = useMemo(() => {
    if (!dbOrder?.createdAt?.seconds) return "Just now";
    return new Date(dbOrder.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [dbOrder]);

  const timelineSteps: StepInfo[] = [
    { title: "Order Placed", desc: "Order details received by restaurant", time: orderTimeStr },
    { title: "Order Confirmed", desc: "Restaurant has accepted and verified your order" },
    { title: "Preparing Food", desc: "Our chef is preparing your fresh meal" },
    { title: "Out for Delivery", desc: `${dbOrder?.driverName || "Ramesh"} is bringing your food to your doorstep` },
    { title: "Delivered", desc: "Enjoy your fresh and delicious meal!" }
  ];

  // ── Status Computed Details ───────────────────────────────────────────────
  const statusHeadlineText = useMemo(() => {
    if (dbOrder?.status === "cancelled") return "Order Cancelled";
    if (dbOrder?.status === "rejected") return "Order Declined";
    switch (activeStep) {
      case 0: return "Order Placed";
      case 1: return "Order Confirmed";
      case 2: return "Preparing your food";
      case 3: return "Out for Delivery";
      case 4: return "Order Delivered";
      default: return "Order Status";
    }
  }, [activeStep, dbOrder?.status]);

  const liveStatusText = useMemo(() => {
    if (dbOrder?.status === "cancelled") return "This order has been cancelled and a refund is being processed.";
    if (dbOrder?.status === "rejected") return "This order was declined by the restaurant.";
    switch (activeStep) {
      case 0: return "Waiting for restaurant accept confirmation...";
      case 1: return "Restaurant has accepted your order and is starting preparation.";
      case 2: return "Our kitchen crew is assembling your fresh specials.";
      case 3: return `${dbOrder?.driverName || "Ramesh Kumar"} has picked up your food and is riding to your location.`;
      case 4: return "Order handed over to customer. Bon appétit!";
      default: return "";
    }
  }, [activeStep, dbOrder]);

  const etaDisplay = useMemo(() => {
    if (dbOrder?.status === "cancelled" || dbOrder?.status === "rejected") return "--";
    switch (activeStep) {
      case 0: return "35 mins";
      case 1: return "30 mins";
      case 2: return "20 mins";
      case 3: return "8 mins";
      case 4: return "Delivered";
      default: return "--";
    }
  }, [activeStep, dbOrder?.status]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCallDriver = () => {
    alert(`📞 Initiating call to Delivery Agent: ${dbOrder?.driverName || "Ramesh Kumar"} (+91 98765 43210)`);
  };

  const handleContactSupport = () => {
    alert("💬 Initiating live chat support connection for Order " + orderId);
  };

  const handleCancelOrder = async () => {
    if (confirm("Are you sure you want to cancel this order?")) {
      try {
        if (!orderDocId) return;
        await updateDoc(doc(db, "orders", orderDocId), {
          status: "cancelled",
          cancelledAt: serverTimestamp()
        });
        alert("❌ Order cancelled successfully. Refund is being processed.");
        router.push("/orders");
      } catch (error: any) {
        console.error("Error cancelling order:", error);
        alert(`Failed to cancel order: ${error?.message || error || "Unknown error"}`);
      }
    }
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


        {/* ── Status Header Card ─────────────────────────────────────────────── */}
        <section className={styles.card} aria-label="Current Order Status">
          <div className={styles.statusHeadline}>
            {activeStep < 4 && dbOrder?.status !== "cancelled" && dbOrder?.status !== "rejected" && (
              <span className={styles.statusPulse} />
            )}
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
              <div className={styles.pinLabelText}>{dbOrder?.restaurantName || "Paradise Biryani"}</div>
              🍳
            </div>
            
            {activeStep >= 1 && activeStep < 4 && dbOrder?.driverId && (
              <div className={`${styles.mapPinIcon} ${styles.pinRider}`} style={riderVisualPosition}>
                <div className={styles.pinLabelText}>{dbOrder?.driverName || "Ramesh"} (Rider)</div>
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
            <span className={styles.mapStatusFooter}>
              {dbOrder?.status === "cancelled" || dbOrder?.status === "rejected" ? "GPS Live Tracking Offline" : "GPS Live Tracking Active"}
            </span>
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
                <h3 className={styles.driverName}>{dbOrder?.driverName || "Ramesh Kumar"}</h3>
                <span className={styles.driverPhone}>{dbOrder?.driverVehicle || "Riding a Splendor Plus"}</span>
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
            <div className={styles.driverAvatar} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "18px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {dbOrder?.restaurantEmoji && (dbOrder.restaurantEmoji.startsWith("http") || dbOrder.restaurantEmoji.startsWith("data:image")) ? (
                <img 
                  src={dbOrder.restaurantEmoji} 
                  alt={dbOrder?.restaurantName} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : dbOrder?.image && (dbOrder.image.startsWith("http") || dbOrder.image.startsWith("data:image")) ? (
                <img 
                  src={dbOrder.image} 
                  alt={dbOrder?.restaurantName} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "🍽️"
              )}
            </div>
            <div className={styles.driverDetails}>
              <span className={styles.driverLabel}>Ordering From</span>
              <h3 id="restaurant-heading" className={styles.driverName}>{dbOrder?.restaurantName || "Paradise Biryani"}</h3>
              <p className={styles.driverPhone}>{dbOrder?.restaurantAddress || dbOrder?.address?.text || "Madhapur, Hyderabad"}</p>
            </div>
          </div>

          <h2 className={styles.summaryHeader}>Receipt Summary</h2>
          
          {dbOrder ? (
            (dbOrder.items || []).map((item: any, idx: number) => (
              <div key={idx} className={styles.summaryRow}>
                <div>
                  <span className={styles.summaryQty}>{item.quantity || 1}x</span>
                  <span className={styles.summaryPrice}>{item.name}</span>
                </div>
                <span className={styles.summaryPrice}>₹{(item.price || 0) * (item.quantity || 1)}</span>
              </div>
            ))
          ) : (
            <>
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
            </>
          )}

          <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Payment Method</span>
              <span style={{ fontWeight: 600 }}>{dbOrder?.paymentMethod === "COD" ? "💵 Cash on Delivery" : "💳 Online Payment"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Payment Status</span>
              <span style={{ fontWeight: 600, color: dbOrder?.paymentStatus === "Paid" || dbOrder?.paymentStatus === "Collected" ? "#10B981" : "#F59E0B" }}>
                {dbOrder?.paymentStatus || "Paid"}
              </span>
            </div>
          </div>

          <div className={styles.summaryTotalRow}>
            <span>{dbOrder?.paymentMethod === "COD" && dbOrder?.paymentStatus === "Pending" ? "Amount to Pay" : "Grand Total"}</span>
            <span className={styles.summaryTotalValue}>₹{dbOrder?.total || dbOrder?.grandTotal || 866}</span>
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

          {activeStep < 3 && dbOrder?.status !== "cancelled" && dbOrder?.status !== "rejected" && (
            <button 
              onClick={handleCancelOrder} 
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

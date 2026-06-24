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
  Info,
  MessageSquare,
  X,
  Send,
  Receipt,
  Upload
} from "lucide-react";
import styles from "./tracking.module.css";
import { db, auth, onAuthChange, uploadImage } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, orderBy, setDoc, addDoc, increment, where } from "firebase/firestore";

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

  // Chat Support States
  const [userUid, setUserUid] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Customer");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportChatDoc, setSupportChatDoc] = useState<any>(null);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Refund States
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundType, setRefundType] = useState<'Full' | 'Partial'>('Full');
  const [refundItems, setRefundItems] = useState<number[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [refundPhoto, setRefundPhoto] = useState<File | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [activeRefund, setActiveRefund] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      setSearchParamsVal(window.location.search);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) {
        setUserUid(user.uid);
        setUserName(user.displayName || "Customer");
      }
    });
    return () => unsub();
  }, []);

  // Listen to active refund request for this order
  useEffect(() => {
    if (!orderDocId) return;
    const q = query(collection(db, "refundRequests"), where("orderId", "==", orderDocId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => d.data());
        docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setActiveRefund(docs[0]);
      } else {
        setActiveRefund(null);
      }
    });
    return () => unsubscribe();
  }, [orderDocId]);

  // Chat listeners
  useEffect(() => {
    if (!userUid) return;

    // Listen to parent doc
    const chatDocRef = doc(db, 'customerSupportChats', userUid);
    const unsubDoc = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSupportChatDoc(data);
        setUnreadAdminCount(data.unreadCountForCustomer || 0);
      }
    });

    // Listen to messages
    const q = query(collection(db, 'customerSupportChats', userUid, 'messages'), orderBy('timestamp', 'asc'));
    const unsubMsgs = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSupportMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Auto-mark read if chat is open
      if (isChatOpen) {
        msgs.forEach(async (m: any) => {
          if (m.sender === 'admin' && !m.read) {
            try {
              await updateDoc(doc(db, 'customerSupportChats', userUid, 'messages', m.id), { read: true });
            } catch (err) {}
          }
        });
        if (unreadAdminCount > 0) {
          updateDoc(chatDocRef, { unreadCountForCustomer: 0 }).catch(() => {});
        }
      }
    });

    return () => {
      unsubDoc();
      unsubMsgs();
    };
  }, [userUid, isChatOpen]);

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

  const handleContactSupport = async () => {
    if (!userUid) {
      alert("Please log in to use support.");
      return;
    }
    
    setIsChatOpen(true);
    
    // Auto-mark existing unread messages as read
    if (unreadAdminCount > 0) {
      try {
        await updateDoc(doc(db, 'customerSupportChats', userUid), { unreadCountForCustomer: 0 });
      } catch (err) {}
    }

    // Create or update ticket
    try {
      const chatDocRef = doc(db, 'customerSupportChats', userUid);
      await setDoc(chatDocRef, {
        orderId: orderId,
        customerName: userName,
        isOnline: true,
        lastActive: serverTimestamp(),
        // Keep status 'waiting' if it's new or closed, don't overwrite if 'connected'
        ...(supportChatDoc?.status !== 'connected' ? { status: 'waiting' } : {})
      }, { merge: true });
    } catch (err) {
      console.error("Error creating support ticket:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!userUid || !chatText.trim()) return;
    
    const textToSend = chatText;
    setChatText('');
    
    try {
      // 1. Add message
      const msgRef = doc(collection(db, 'customerSupportChats', userUid, 'messages'));
      await setDoc(msgRef, {
        sender: 'customer',
        text: textToSend,
        timestamp: serverTimestamp(),
        read: false
      });
      
      // 2. Update parent
      const chatDocRef = doc(db, 'customerSupportChats', userUid);
      await setDoc(chatDocRef, {
        lastMessageText: textToSend,
        lastMessageTimestamp: serverTimestamp(),
        unreadCountForAdmin: increment(1)
      }, { merge: true });
      
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleCancelOrder = async () => {
    if (confirm("Are you sure you want to cancel this order?")) {
      try {
        if (!orderDocId) return;

        if (dbOrder?.paymentMethod !== 'COD' && dbOrder?.paymentStatus === 'Paid') {
          const isBeforeAccept = activeStep < 1;
          const refId = 'refund_cancel_' + Date.now();
          const autoStatus = isBeforeAccept ? 'Approved' : 'Under Admin Review';
          
          await setDoc(doc(db, 'refundRequests', refId), {
            id: refId,
            orderId: orderDocId,
            customerId: userUid,
            customerName: userName,
            restaurantId: dbOrder.restaurantId || '',
            amount: dbOrder.grandTotal || dbOrder.total || 0,
            type: 'Full',
            reason: 'Order Cancelled by Customer',
            evidenceUrl: '',
            items: dbOrder.items || [],
            status: autoStatus,
            isCancellationRefund: true,
            createdAt: new Date().toLocaleString(),
            timestamp: serverTimestamp()
          });
        }

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

  const { canRefund, isPastRefundWindow } = useMemo(() => {
    let allowed = false;
    let pastWindow = false;
    if (!dbOrder) return { canRefund: false, isPastRefundWindow: false };
    if (['cancelled', 'rejected', 'refunded'].includes(dbOrder.status)) {
      return { canRefund: false, isPastRefundWindow: false };
    }
    if (activeStep >= 1) {
      allowed = true;
      const deliveredAt = dbOrder.deliveredAt || dbOrder.updatedAt || dbOrder.createdAt;
      if (dbOrder.status === 'delivered' && deliveredAt?.seconds) {
        const hoursSince = (Date.now() / 1000 - deliveredAt.seconds) / 3600;
        if (hoursSince > 12) {
          pastWindow = true;
        }
      }
    }
    return { canRefund: allowed, isPastRefundWindow: pastWindow };
  }, [dbOrder, activeStep]);

  const submitRefundRequest = async () => {
    if (!userUid) return alert("Please log in to request a refund.");
    if (!refundReason.trim()) return alert("Please provide a reason for the refund.");
    if (refundType === 'Partial' && refundItems.length === 0) return alert("Please select at least one item for partial refund.");
    
    setIsSubmittingRefund(true);
    try {
      let photoUrl = "";
      if (refundPhoto) {
        photoUrl = await uploadImage(`refunds/${orderDocId}_${Date.now()}`, refundPhoto);
      }

      const requestedAmount = refundType === 'Full' 
        ? (dbOrder?.grandTotal || dbOrder?.total || 0) 
        : refundItems.reduce((sum, idx) => sum + ((dbOrder.items[idx].price || 0) * (dbOrder.items[idx].quantity || 1)), 0);

      const requestedItemsList = refundType === 'Full' 
        ? dbOrder.items 
        : refundItems.map(idx => dbOrder.items[idx]);

      const refundId = 'ref_' + Date.now();
      await setDoc(doc(db, 'refundRequests', refundId), {
        id: refundId,
        orderId: orderDocId,
        customerId: userUid,
        customerName: userName,
        restaurantId: dbOrder.restaurantId || '',
        amount: requestedAmount,
        type: refundType,
        reason: refundReason,
        evidenceUrl: photoUrl,
        items: requestedItemsList,
        status: 'Pending',
        createdAt: new Date().toLocaleString(),
        timestamp: serverTimestamp()
      });

      alert("Refund request submitted successfully. It is under review.");
      setIsRefundOpen(false);
      setRefundReason('');
      setRefundPhoto(null);
      setRefundItems([]);
    } catch (err: any) {
      alert("Error submitting refund: " + err.message);
    } finally {
      setIsSubmittingRefund(false);
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

          {activeRefund && (
            <div style={{
              background: activeRefund.status === 'Approved' || activeRefund.status === 'Completed' || activeRefund.status === 'Refunded' ? 'rgba(16, 185, 129, 0.1)' : activeRefund.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${activeRefund.status === 'Approved' || activeRefund.status === 'Completed' || activeRefund.status === 'Refunded' ? 'rgba(16, 185, 129, 0.3)' : activeRefund.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>Refund Status: {activeRefund.status === 'Pending' || activeRefund.status === 'Under Admin Review' ? 'Refund Pending' : activeRefund.status === 'Completed' ? 'Refunded' : activeRefund.status}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{activeRefund.isCancellationRefund ? 'Cancelled Order Refund' : 'Requested Refund'} • ₹{activeRefund.amount} • {activeRefund.createdAt}</div>
              </div>
              <Receipt size={20} color={activeRefund.status === 'Approved' || activeRefund.status === 'Completed' || activeRefund.status === 'Refunded' ? '#10B981' : activeRefund.status === 'Rejected' ? '#EF4444' : '#F59E0B'} />
            </div>
          )}

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
            <button onClick={handleContactSupport} className={styles.secondaryBtn} style={{ position: 'relative' }}>
              <HelpCircle size={14} />
              <span>Support</span>
              {unreadAdminCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  backgroundColor: '#EF4444', color: 'white', fontSize: '10px',
                  fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadAdminCount}
                </span>
              )}
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

          {canRefund && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <button 
                onClick={() => setIsRefundOpen(true)} 
                disabled={isPastRefundWindow}
                className={styles.cancelBtn}
                style={{ 
                  backgroundColor: isPastRefundWindow ? '#374151' : '#1F2937', 
                  color: isPastRefundWindow ? '#9CA3AF' : '#FFF',
                  cursor: isPastRefundWindow ? 'not-allowed' : 'pointer',
                  opacity: isPastRefundWindow ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Receipt size={14} style={{ marginRight: '6px' }} />
                Request Refund
              </button>
              {isPastRefundWindow && (
                <span style={{ fontSize: '11px', color: '#EF4444', textAlign: 'center', marginTop: '2px' }}>
                  Refund requests are available for 12 hours after delivery.
                </span>
              )}
            </div>
          )}

          <button onClick={() => router.push("/")} className={styles.homeBtn}>
            <Home size={14} />
            <span>Go to Homepage</span>
          </button>
        </div>

      </div>

      {/* ── Chat Modal ──────────────────────────────────────────────────────── */}
      {isChatOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#121212', zIndex: 9999,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Chat Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px', backgroundColor: '#1A1A1A', borderBottom: '1px solid #333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(255,107,53,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#FF6B35'
              }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#FFF' }}>Live Support</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#A1A1AA' }}>
                  {supportChatDoc?.assignedAdminName ? `Connected to ${supportChatDoc.assignedAdminName}` : 'Connecting to an agent...'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              style={{ background: 'none', border: 'none', color: '#A1A1AA', padding: '8px' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1, padding: '16px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '12px',
            backgroundColor: '#000'
          }}>
            <div style={{
              alignSelf: 'center', backgroundColor: '#1F2937', color: '#D1D5DB',
              padding: '8px 16px', borderRadius: '16px', fontSize: '12px',
              marginBottom: '16px'
            }}>
              Support chat initiated for Order {orderId}
            </div>

            {supportMessages.map((msg, idx) => {
              const isMe = msg.sender === 'customer';
              const timeStr = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={idx} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%', display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    backgroundColor: isMe ? '#FF6B35' : '#27272A',
                    color: '#FFF', padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '14px', lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '10px', color: '#71717A', marginTop: '4px' }}>
                    {timeStr} {isMe && (msg.read ? '• Read' : '• Sent')}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '16px', backgroundColor: '#1A1A1A', borderTop: '1px solid #333',
            display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}>
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              style={{
                flex: 1, backgroundColor: '#27272A', border: '1px solid #3F3F46',
                borderRadius: '24px', padding: '12px 16px', color: '#FFF',
                fontSize: '14px', outline: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatText.trim()}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: chatText.trim() ? '#FF6B35' : '#3F3F46',
                border: 'none', color: '#FFF', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.2s',
                opacity: chatText.trim() ? 1 : 0.5
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Refund Modal ──────────────────────────────────────────────────────── */}
      {isRefundOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1E1E1E', borderRadius: '16px', width: '100%', maxWidth: '400px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative'
          }}>
            <button 
              onClick={() => setIsRefundOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#A1A1AA' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={24} color="#FF6B35" /> Request Refund
            </h2>

            {/* Refund Type Selection */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setRefundType('Full')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${refundType === 'Full' ? '#FF6B35' : '#333'}`,
                  backgroundColor: refundType === 'Full' ? 'rgba(255,107,53,0.1)' : '#2A2A2A',
                  color: '#FFF', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                Full Order
              </button>
              <button
                onClick={() => setRefundType('Partial')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${refundType === 'Partial' ? '#FF6B35' : '#333'}`,
                  backgroundColor: refundType === 'Partial' ? 'rgba(255,107,53,0.1)' : '#2A2A2A',
                  color: '#FFF', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                Partial Items
              </button>
            </div>

            {/* Partial Items Checklist */}
            {refundType === 'Partial' && dbOrder?.items && (
              <div style={{ marginBottom: '20px', backgroundColor: '#2A2A2A', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#A1A1AA' }}>Select items to refund:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dbOrder.items.map((item: any, idx: number) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={refundItems.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) setRefundItems(prev => [...prev, idx]);
                          else setRefundItems(prev => prev.filter(i => i !== idx));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#FF6B35' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, color: '#FFF' }}>
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#A1A1AA', fontSize: '14px' }}>Reason for refund</label>
              <textarea 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please describe the issue (e.g., missing item, poor quality)..."
                rows={3}
                style={{
                  width: '100%', backgroundColor: '#2A2A2A', border: '1px solid #333',
                  borderRadius: '8px', padding: '12px', color: '#FFF', fontSize: '14px', resize: 'vertical'
                }}
              />
            </div>

            {/* Photo Evidence */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#A1A1AA', fontSize: '14px' }}>Photo Evidence (Optional)</label>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#2A2A2A', border: '1px dashed #555', borderRadius: '8px', padding: '20px',
                cursor: 'pointer', transition: 'border 0.2s', color: refundPhoto ? '#FF6B35' : '#888'
              }}>
                <Upload size={24} style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '14px' }}>{refundPhoto ? refundPhoto.name : "Upload a photo"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setRefundPhoto(e.target.files[0]);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitRefundRequest}
              disabled={isSubmittingRefund}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#FF6B35',
                color: '#FFF', fontWeight: 600, border: 'none', cursor: isSubmittingRefund ? 'not-allowed' : 'pointer',
                opacity: isSubmittingRefund ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}
            >
              {isSubmittingRefund ? "Submitting..." : "Submit Refund Request"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

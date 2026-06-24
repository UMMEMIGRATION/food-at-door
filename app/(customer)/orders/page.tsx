"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  X, 
  Compass, 
  ShoppingBag, 
  ClipboardList, 
  User,
  RotateCcw,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt
} from "lucide-react";
import styles from "./orders.module.css";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useCartStore } from "@/store/useCartStore";

// ── Types ────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
  description: string;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantEmoji: string;
  date: string;
  status: "active" | "delivered" | "cancelled";
  statusText: string;
  items: OrderItem[];
  totalPrice: number;
  image?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const { clearCart, addItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setOrders([]);
        setRefunds({});
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "orders"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnap = onSnapshot(q, (snap) => {
        const list = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          
          let statusText = "Pending Approval";
          let status: "active" | "delivered" | "cancelled" = "active";
          
          if (data.status === "pending") {
            statusText = "Pending Approval";
            status = "active";
          } else if (data.status === "accepted") {
            statusText = "Preparing food";
            status = "active";
          } else if (data.status === "picked_up" || data.status === "out_for_delivery") {
            statusText = "Out for Delivery";
            status = "active";
          } else if (data.status === "delivered") {
            statusText = "Delivered";
            status = "delivered";
          } else if (data.status === "cancelled" || data.status === "rejected") {
            statusText = "Cancelled";
            status = "cancelled";
          }

          let dateStr = "Just now";
          if (data.createdAt?.seconds) {
            const date = new Date(data.createdAt.seconds * 1000);
            dateStr = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          }

          return {
            id: docSnap.id,
            restaurantId: data.restaurantId || "",
            restaurantName: data.restaurantName || "Paradise Biryani",
            restaurantEmoji: data.restaurantEmoji || "🍛",
            date: dateStr,
            status,
            statusText,
            items: (data.items || []).map((item: any) => ({
              id: item.itemId || item.id || "",
              name: item.name || "Food Item",
              price: item.price || 0,
              qty: item.quantity || 1,
              emoji: item.image || item.emoji || "🍔",
              description: item.description || ""
            })),
            totalPrice: data.total || data.grandTotal || 0,
            image: data.restaurantEmoji || data.image || data.restaurantImage || "🍛",
            paymentMethod: data.paymentMethod || "ONLINE",
            paymentStatus: data.paymentStatus || "Paid"
          };
        });
        setOrders(list);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching customer orders snapshot:", error);
        setLoading(false);
      });

      const qRefunds = query(
        collection(db, "refundRequests"),
        where("customerId", "==", user.uid)
      );
      const unsubscribeRefunds = onSnapshot(qRefunds, (refundSnap) => {
        const refundMap: Record<string, any> = {};
        refundSnap.forEach((doc) => {
          const refundData = doc.data();
          const existing = refundMap[refundData.orderId];
          if (!existing || (refundData.timestamp?.seconds || 0) > (existing.timestamp?.seconds || 0)) {
            refundMap[refundData.orderId] = refundData;
          }
        });
        setRefunds(refundMap);
      });

      return () => {
        unsubscribeSnap();
        unsubscribeRefunds();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const enrichedOrders = useMemo(() => {
    return orders.map(order => {
      const refund = refunds[order.id];
      if (refund) {
        let statusText = order.statusText;
        let status = order.status;
        
        if (refund.status === 'Completed' || refund.status === 'Refunded') {
          statusText = `Refund Completed (₹${refund.amount})`;
          status = 'cancelled';
        } else if (refund.status === 'Approved') {
          statusText = `Refund Approved (₹${refund.amount})`;
          status = 'cancelled';
        } else if (refund.status === 'Pending' || refund.status === 'Under Admin Review') {
          statusText = `Refund Pending (₹${refund.amount})`;
          status = 'cancelled';
        } else if (refund.status === 'Rejected') {
          statusText = `Refund Rejected`;
          status = 'cancelled';
        }
        
        return {
          ...order,
          statusText,
          refundStatus: refund.status,
          refundAmount: refund.amount,
          refundUpdatedAt: refund.updatedAt || refund.createdAt
        };
      }
      return order;
    });
  }, [orders, refunds]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      const matchesSearch = 
        order.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filter === "all" || order.status === filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [enrichedOrders, searchQuery, filter]);

  const handleReorder = (order: Order) => {
    // 1. Clear cart
    clearCart();
    
    // 2. Add each item from the order to the cart
    order.items.forEach(item => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        description: item.description,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName
      });
      // Set the exact quantity
      updateQuantity(item.id, item.qty);
    });

    alert(`🛒 Reordering items from ${order.restaurantName}! Items added to cart.`);
    router.push("/cart");
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/")} 
          className={styles.backBtn}
          aria-label="Back to home"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Your Orders</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <span className={styles.searchIconWrap}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by restaurant or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className={styles.clearBtn}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {(["all", "active", "delivered", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`${styles.filterTab} ${filter === tab ? styles.filterTabActive : ""}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            <h3 className={styles.emptyTitle}>No orders found</h3>
            <p className={styles.emptyDesc}>
              Try changing your filters or searching for something else.
            </p>
            <button onClick={() => router.push("/")} className={styles.exploreBtn}>
              Order Something Fresh
            </button>
          </div>
        ) : (
          <div className={styles.orderList}>
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={styles.orderCard}
                onClick={() => router.push(`/orders/track?id=${order.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.cardHeader}>
                  {order.image && (order.image.startsWith("http") || order.image.startsWith("data:image")) ? (
                    <img 
                      src={order.image} 
                      alt={order.restaurantName} 
                      className={styles.restaurantImage}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=80&q=80";
                      }}
                    />
                  ) : (
                    <span className={styles.restaurantEmoji}>{order.image || "🍛"}</span>
                  )}
                  <div className={styles.restaurantMeta}>
                    <h3 className={styles.restaurantName}>{order.restaurantName}</h3>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  <span className={`
                    ${styles.statusPill}
                    ${order.status === "active" ? styles.statusActive : ""}
                    ${order.status === "delivered" ? styles.statusDelivered : ""}
                    ${(order as any).refundStatus === "Completed" ? styles.statusDelivered : (order.status === "cancelled" ? styles.statusCancelled : "")}
                  `}
                  style={(order as any).refundStatus === "Completed" ? { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981", border: "1px solid rgba(16, 185, 129, 0.3)" } : {}}
                  >
                    {(order as any).refundStatus === "Completed" ? "REFUNDED" : order.statusText}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.itemsSummary}>
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.qty}x {item.name}
                      </div>
                    ))}
                  </div>

                  {(order as any).refundStatus === "Completed" && (
                    <div style={{ marginTop: "8px", padding: "8px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", fontSize: "11px", color: "#A7F3D0" }}>
                      <div>💰 Refunded Amount: ₹{(order as any).refundAmount}</div>
                      <div style={{ color: "#9CA3AF", marginTop: "2px" }}>Completed: {(order as any).refundUpdatedAt}</div>
                    </div>
                  )}

                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#9CA3AF", display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                    <span>Payment: {order.paymentMethod === "COD" ? "💵 Cash on Delivery" : "💳 Online Payment"}</span>
                    <span style={{ color: order.paymentStatus === "Paid" || order.paymentStatus === "Collected" ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
                      {order.paymentStatus === "Collected" ? "Collected" : order.paymentStatus}
                    </span>
                  </div>

                  <div className={styles.priceRow}>
                    <span className={styles.totalLabel}>Grand Total</span>
                    <span className={styles.totalValue}>₹{order.totalPrice}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {order.status === "active" ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/orders/track?id=${order.id}`); }}
                      className={styles.trackBtn}
                    >
                      <Navigation size={14} fill="#fff" />
                      <span>Track Live Order</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/orders/track?id=${order.id}`); }}
                        className={styles.reorderBtn}
                      >
                        <Receipt size={14} />
                        <span>View Details</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                        className={styles.reorderBtn}
                      >
                        <RotateCcw size={14} />
                        <span>Reorder</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav} aria-label="Main Navigation">
        <button onClick={() => router.push("/")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
            <Compass size={22} />
          </div>
          <span className={styles.navLabel}>Explore</span>
        </button>

        <button onClick={() => router.push("/#search")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
            <Search size={22} />
          </div>
          <span className={styles.navLabel}>Search</span>
        </button>

        <button onClick={() => router.push("/cart")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
            <ShoppingBag size={22} />
          </div>
          <span className={styles.navLabel}>Cart</span>
        </button>

        <button className={`${styles.navItem} ${styles.navItemActive}`}>
          <div className={styles.navIconWrap}>
            <span className={styles.navActiveIndicator} />
            <ClipboardList size={22} />
          </div>
          <span className={styles.navLabel}>Orders</span>
        </button>

        <button onClick={() => router.push("/profile")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
            <User size={22} />
          </div>
          <span className={styles.navLabel}>Profile</span>
        </button>
      </nav>
    </main>
  );
}

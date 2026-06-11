"use client";

import React, { useState, useMemo } from "react";
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
  Clock
} from "lucide-react";
import styles from "./orders.module.css";

// ── Types & Mock Data ────────────────────────────────────────────────────────
interface OrderItem {
  name: string;
  qty: number;
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
}

const MOCK_ORDERS: Order[] = [
  {
    id: "8409-1834",
    restaurantId: "f1",
    restaurantName: "Paradise Biryani",
    restaurantEmoji: "🍛",
    date: "Today, 04:12 PM",
    status: "active",
    statusText: "Preparing food",
    items: [
      { name: "Special Chicken Biryani", qty: 2 },
      { name: "Niloufer Special Tea", qty: 1 }
    ],
    totalPrice: 866
  },
  {
    id: "9218-4721",
    restaurantId: "p1",
    restaurantName: "Cafe Niloufer",
    restaurantEmoji: "☕",
    date: "Yesterday, 08:30 AM",
    status: "delivered",
    statusText: "Delivered",
    items: [
      { name: "Osmania Biscuits (Box)", qty: 1 },
      { name: "Bun Maska", qty: 2 },
      { name: "Special Ginger Chai", qty: 3 }
    ],
    totalPrice: 420
  },
  {
    id: "1932-8491",
    restaurantId: "f2",
    restaurantName: "Shah Ghouse",
    restaurantEmoji: "🍗",
    date: "08 Jun 2026, 09:15 PM",
    status: "delivered",
    statusText: "Delivered",
    items: [
      { name: "Chicken Mandi (Half)", qty: 1 },
      { name: "Double ka Meetha", qty: 1 }
    ],
    totalPrice: 510
  },
  {
    id: "3821-9304",
    restaurantId: "p3",
    restaurantName: "Chutneys",
    restaurantEmoji: "🥞",
    date: "04 Jun 2026, 08:12 AM",
    status: "cancelled",
    statusText: "Cancelled",
    items: [
      { name: "Guntur Idli", qty: 2 },
      { name: "Babai Hotel Dosa", qty: 1 }
    ],
    totalPrice: 270
  }
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      const matchesSearch = 
        order.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filter === "all" || order.status === filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  const handleReorder = (order: Order) => {
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
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.restaurantEmoji}>{order.restaurantEmoji}</span>
                  <div className={styles.restaurantMeta}>
                    <h3 className={styles.restaurantName}>{order.restaurantName}</h3>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  <span className={`
                    ${styles.statusPill}
                    ${order.status === "active" ? styles.statusActive : ""}
                    ${order.status === "delivered" ? styles.statusDelivered : ""}
                    ${order.status === "cancelled" ? styles.statusCancelled : ""}
                  `}>
                    {order.statusText}
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
                  <div className={styles.priceRow}>
                    <span className={styles.totalLabel}>Grand Total</span>
                    <span className={styles.totalValue}>₹{order.totalPrice}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {order.status === "active" ? (
                    <button 
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className={styles.trackBtn}
                    >
                      <Navigation size={14} fill="#fff" />
                      <span>Track Live Order</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleReorder(order)}
                      className={styles.reorderBtn}
                    >
                      <RotateCcw size={14} />
                      <span>Reorder</span>
                    </button>
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

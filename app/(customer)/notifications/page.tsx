"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellRing, ClipboardList, ShoppingBag, Compass, Search, User } from "lucide-react";
import styles from "./notifications.module.css";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "order" | "promo";
  unread: boolean;
  emoji: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Order Picked Up! 🚴",
    desc: "Rider Ramesh Kumar has picked up your order and is heading to you.",
    time: "2 mins ago",
    type: "order",
    unread: true,
    emoji: "🚴"
  },
  {
    id: "notif-2",
    title: "50% OFF Biryani Bonanza! 🍛",
    desc: "Get flat 50% discount on Paradise Biryani specials today only! Use code FAD50.",
    time: "2 hours ago",
    type: "promo",
    unread: true,
    emoji: "🍛"
  },
  {
    id: "notif-3",
    title: "Order Confirmed by Paradise Biryani",
    desc: "Your order FAD-8409-1834 has been accepted by the restaurant.",
    time: "20 mins ago",
    type: "order",
    unread: false,
    emoji: "🍳"
  },
  {
    id: "notif-4",
    title: "Weekend Cashback Offer 💰",
    desc: "Get ₹50 flat cashback on your next Paytm UPI transaction above ₹300.",
    time: "1 day ago",
    type: "promo",
    unread: false,
    emoji: "💰"
  }
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    alert("✅ All notifications marked as read!");
  };

  const handleItemClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const hasUnread = notifications.some(n => n.unread);

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => router.back()} 
            className={styles.backBtn}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>Notifications</h1>
        </div>
        {hasUnread && (
          <button onClick={handleMarkAllAsRead} className={styles.markReadBtn}>
            Mark All Read
          </button>
        )}
      </header>

      <div className={styles.scrollBody}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔔</span>
            <h3 className={styles.emptyTitle}>All caught up!</h3>
            <p className={styles.emptyDesc}>
              No new alerts or notifications. We'll update you here on order cycles.
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleItemClick(item.id)}
                className={`
                  ${styles.item} 
                  ${item.unread ? styles.itemUnread : ""}
                `}
              >
                {item.unread && <span className={styles.unreadGlow} />}
                
                <div className={`
                  ${styles.iconWrap}
                  ${item.type === "order" ? styles.iconOrder : styles.iconPromo}
                `}>
                  {item.emoji}
                </div>

                <div className={styles.content}>
                  <h3 className={styles.title}>{item.title}</h3>
                  <p className={styles.desc}>{item.desc}</p>
                  <span className={styles.time}>{item.time}</span>
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

        <button onClick={() => router.push("/orders")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
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

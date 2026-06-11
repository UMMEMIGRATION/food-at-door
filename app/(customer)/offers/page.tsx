"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Flame, Clock, Compass, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./offers.module.css";

interface PromoOffer {
  id: string;
  tag: string;
  title: string;
  desc: string;
  expiry: string;
  isCritical: boolean;
}

const MOCK_OFFERS: PromoOffer[] = [
  {
    id: "off-1",
    tag: "Bestseller Deal",
    title: "Paradise Biryani Special Combo",
    desc: "Get 2x Chicken Biryani + 1x Pepsi for flat ₹699.",
    expiry: "2 hours left",
    isCritical: true
  },
  {
    id: "off-2",
    tag: "Freebie Offer",
    title: "Niloufer Ginger Tea Deal",
    desc: "Buy 3 ginger teas, get 1 Osmania Biscuits Box free.",
    expiry: "Expires today",
    isCritical: true
  },
  {
    id: "off-3",
    tag: "Cashback Reward",
    title: "Cred Pay Instant Discount",
    desc: "Get flat ₹100 cashback when billing via Cred Pay UPI.",
    expiry: "Valid for 3 days",
    isCritical: false
  },
  {
    id: "off-4",
    tag: "First Order Special",
    title: "Flat ₹150 off on New signups",
    desc: "Valid on first 3 orders above ₹299. Code: WELCOME150.",
    expiry: "Valid for 7 days",
    isCritical: false
  }
];

export default function OffersPage() {
  const router = useRouter();

  const handleApplyOffer = (offer: PromoOffer) => {
    alert(`🎉 Offer "${offer.title}" selected! Promo will be automatically applied at checkout.`);
    router.push("/");
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/")} 
          className={styles.backBtn}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Deals & Offers</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Horizontal Discount Banners */}
        <div className={styles.bannerScroll}>
          <div className={styles.banner} style={{ background: "linear-gradient(135deg, #FF6B35, #FF8C55)" }}>
            <span style={{ fontStyle: "italic", fontSize: "10px", fontWeight: 700, opacity: 0.8 }}>⚡ CRITICAL FLASH SALE</span>
            <h3 className={styles.bannerTitle}>Flat 60% OFF on Traditional Mandi</h3>
            <span className={styles.bannerSubtitle}>Valid until midnight today</span>
          </div>
          <div className={styles.banner} style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
            <span style={{ fontStyle: "italic", fontSize: "10px", fontWeight: 700, opacity: 0.8 }}>🚴 FREE DELIVERY</span>
            <h3 className={styles.bannerTitle}>No delivery fee on all cafes & bakeries</h3>
            <span className={styles.bannerSubtitle}>Valid on orders above ₹150</span>
          </div>
        </div>

        {/* Category Offers */}
        <section style={{ marginBottom: "28px" }}>
          <h2 className={styles.sectionTitle}>Offers by Category</h2>
          <div className={styles.categoryGrid}>
            <div className={styles.categoryCard} onClick={() => alert("🍛 Loading Biryani special deals...")}>
              <span className={styles.categoryEmoji}>🍛</span>
              <span className={styles.categoryLabel}>Biryani Offers</span>
            </div>
            <div className={styles.categoryCard} onClick={() => alert("🍗 Loading Mandi special deals...")}>
              <span className={styles.categoryEmoji}>🍗</span>
              <span className={styles.categoryLabel}>Mandi Deals</span>
            </div>
            <div className={styles.categoryCard} onClick={() => alert("☕ Loading Chai combo deals...")}>
              <span className={styles.categoryEmoji}>☕</span>
              <span className={styles.categoryLabel}>Chai Combos</span>
            </div>
            <div className={styles.categoryCard} onClick={() => alert("🍰 Loading Dessert coupon deals...")}>
              <span className={styles.categoryEmoji}>🍰</span>
              <span className={styles.categoryLabel}>Dessert Codes</span>
            </div>
          </div>
        </section>

        {/* Promo cards list */}
        <section>
          <h2 className={styles.sectionTitle}>Active Promotional Offers</h2>
          <div className={styles.offerList}>
            {MOCK_OFFERS.map((offer) => (
              <div 
                key={offer.id} 
                onClick={() => handleApplyOffer(offer)}
                className={styles.offerCard}
              >
                <div className={styles.offerLeft}>
                  <span className={styles.promoTag}>{offer.tag}</span>
                  <h3 className={styles.offerTitle}>{offer.title}</h3>
                  <p className={styles.offerDesc}>{offer.desc}</p>
                </div>
                <div className={`
                  ${styles.expiryBadge}
                  ${offer.isCritical ? styles.expiryCritical : ""}
                `}>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={10} />
                    <span>{offer.expiry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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

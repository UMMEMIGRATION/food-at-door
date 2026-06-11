"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2, Star, Clock, Heart, Compass, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./favorites.module.css";

interface FavRestaurant {
  id: string;
  name: string;
  emoji: string;
  rating: number;
  time: string;
  cuisine: string;
}

interface FavDish {
  id: string;
  name: string;
  emoji: string;
  price: number;
  restaurantName: string;
}

const INITIAL_RESTAURANTS: FavRestaurant[] = [
  { id: "f-r1", name: "Paradise Biryani", emoji: "🍛", rating: 4.8, time: "25 mins", cuisine: "Biryani, Kebabs" },
  { id: "f-r2", name: "Cafe Niloufer", emoji: "☕", rating: 4.9, time: "15 mins", cuisine: "Chai, Osmania Biscuits" },
  { id: "f-r3", name: "Shah Ghouse", emoji: "🍗", rating: 4.7, time: "30 mins", cuisine: "Biryani, Mandi" }
];

const INITIAL_DISHES: FavDish[] = [
  { id: "f-d1", name: "Special Chicken Biryani", emoji: "🍛", price: 380, restaurantName: "Paradise Biryani" },
  { id: "f-d2", name: "Bun Maska", emoji: "🥯", price: 80, restaurantName: "Cafe Niloufer" },
  { id: "f-d3", name: "Osmania Biscuits (Box)", emoji: "🍪", price: 150, restaurantName: "Cafe Niloufer" }
];

export default function FavoritesPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"restaurants" | "dishes">("restaurants");
  const [searchQuery, setSearchQuery] = useState("");

  const [restaurants, setRestaurants] = useState<FavRestaurant[]>(INITIAL_RESTAURANTS);
  const [dishes, setDishes] = useState<FavDish[]>(INITIAL_DISHES);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.restaurantName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dishes, searchQuery]);

  const handleRemoveRestaurant = (id: string, name: string) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    alert(`💔 Removed "${name}" from favorite restaurants.`);
  };

  const handleRemoveDish = (id: string, name: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    alert(`💔 Removed "${name}" from favorite dishes.`);
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
        <h1 className={styles.headerTitle}>Favorites</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Split Tabs */}
        <div className={styles.tabs}>
          <button 
            onClick={() => { setActiveTab("restaurants"); setSearchQuery(""); }}
            className={`${styles.tab} ${activeTab === "restaurants" ? styles.tabActive : ""}`}
          >
            Saved Restaurants
          </button>
          <button 
            onClick={() => { setActiveTab("dishes"); setSearchQuery(""); }}
            className={`${styles.tab} ${activeTab === "dishes" ? styles.tabActive : ""}`}
          >
            Saved Dishes
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <span className={styles.searchIconWrap}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={activeTab === "restaurants" ? "Search saved restaurants..." : "Search saved dishes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Restaurants Tab content */}
        {activeTab === "restaurants" && (
          filteredRestaurants.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🍽️</span>
              <h3 className={styles.emptyTitle}>No saved restaurants</h3>
              <p className={styles.emptyDesc}>Explore top restaurants near you and tap the heart icon to save them.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredRestaurants.map(r => (
                <div key={r.id} className={styles.card}>
                  <div className={styles.cardEmoji}>{r.emoji}</div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{r.name}</h3>
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>{r.cuisine}</span>
                    <div className={styles.cardMeta} style={{ marginTop: "4px" }}>
                      <span className={styles.rating}><Star size={11} fill="#FFAB40" stroke="none" />{r.rating}</span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Clock size={11} />{r.time}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveRestaurant(r.id, r.name)}
                    className={styles.removeBtn}
                    aria-label="Remove restaurant"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Dishes Tab content */}
        {activeTab === "dishes" && (
          filteredDishes.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🍔</span>
              <h3 className={styles.emptyTitle}>No saved dishes</h3>
              <p className={styles.emptyDesc}>Add your favorite specials here for quick single-tap reorder options.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredDishes.map(d => (
                <div key={d.id} className={styles.card}>
                  <div className={styles.cardEmoji}>{d.emoji}</div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{d.name}</h3>
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>from {d.restaurantName}</span>
                    <span className={styles.price}>₹{d.price}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveDish(d.id, d.name)}
                    className={styles.removeBtn}
                    aria-label="Remove dish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
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

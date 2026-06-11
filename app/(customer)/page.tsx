"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  Clock, 
  X, 
  Compass, 
  ShoppingBag, 
  ClipboardList, 
  User,
  Percent,
  SearchCheck
} from "lucide-react";
import HomeHeader from "./HomeHeader";
import styles from "./home.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock Data
// ─────────────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  rating: number;
  deliveryTime: string; // e.g. "20-25 mins"
  distance: string; // e.g. "1.8 km"
  avgPrice: string; // e.g. "₹200 for one"
  emoji: string;
  isOpen: boolean;
  promo?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "biryani", label: "Biryani", emoji: "🍛" },
  { id: "mandi", label: "Mandi", emoji: "🍗" },
  { id: "shawarma", label: "Shawarma", emoji: "🌯" },
  { id: "south-indian", label: "Dosas", emoji: "🥞" },
  { id: "chai", label: "Chai", emoji: "☕" },
  { id: "desserts", label: "Desserts", emoji: "🍰" },
];

const FEATURED_RESTAURANTS: Restaurant[] = [
  {
    id: "f1",
    name: "Paradise Biryani",
    cuisine: "Hyderabadi Biryani, Kebabs",
    category: "biryani",
    rating: 4.8,
    deliveryTime: "25 mins",
    distance: "2.4 km",
    avgPrice: "₹300 for one",
    emoji: "🍛",
    isOpen: true,
    promo: "Free Delivery",
  },
  {
    id: "f2",
    name: "Shah Ghouse",
    cuisine: "Biryani, Mandi, Haleem",
    category: "biryani",
    rating: 4.7,
    deliveryTime: "30 mins",
    distance: "3.2 km",
    avgPrice: "₹250 for one",
    emoji: "🍗",
    isOpen: true,
    promo: "50% OFF up to ₹100",
  },
  {
    id: "f3",
    name: "Pista House",
    cuisine: "Bakery, Desserts, Haleem",
    category: "desserts",
    rating: 4.6,
    deliveryTime: "18 mins",
    distance: "1.5 km",
    avgPrice: "₹150 for one",
    emoji: "🍰",
    isOpen: true,
    promo: "Buy 1 Get 1 Free",
  },
];

const POPULAR_RESTAURANTS: Restaurant[] = [
  {
    id: "p1",
    name: "Cafe Niloufer",
    cuisine: "Chai, Osmania Biscuits, Bakery",
    category: "chai",
    rating: 4.9,
    deliveryTime: "15 mins",
    distance: "1.0 km",
    avgPrice: "₹100 for one",
    emoji: "☕",
    isOpen: true,
    promo: "Trending #1",
  },
  {
    id: "p2",
    name: "Bawarchi Restaurant",
    cuisine: "Traditional Hyderabadi Biryani",
    category: "biryani",
    rating: 4.7,
    deliveryTime: "35 mins",
    distance: "4.2 km",
    avgPrice: "₹280 for one",
    emoji: "🍛",
    isOpen: true,
    promo: "Flat ₹100 OFF",
  },
  {
    id: "p3",
    name: "Chutneys",
    cuisine: "South Indian, Guntur Idli, Dosa",
    category: "south-indian",
    rating: 4.5,
    deliveryTime: "20 mins",
    distance: "2.1 km",
    avgPrice: "₹200 for one",
    emoji: "🥞",
    isOpen: true,
  },
  {
    id: "p4",
    name: "Mehfil Restaurant",
    cuisine: "Biryani, Tandoori, Mughlai",
    category: "biryani",
    rating: 4.6,
    deliveryTime: "28 mins",
    distance: "3.7 km",
    avgPrice: "₹220 for one",
    emoji: "🍖",
    isOpen: true,
    promo: "30% OFF",
  },
  {
    id: "p5",
    name: "Ice & Spice Mandi",
    cuisine: "Arabian Mandi, Shawarma",
    category: "mandi",
    rating: 4.4,
    deliveryTime: "26 mins",
    distance: "2.8 km",
    avgPrice: "₹350 for one",
    emoji: "🍗",
    isOpen: false, // Closed restaurant test
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerHomePage() {
  const router = useRouter();
  // ── States ─────────────────────────────────────────────────────────────────
  const [location, setLocation] = useState("Madhapur, Hyderabad");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("home");
  
  // Cart item count (mocked)
  const cartItemCount = 3;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLocationClick = () => {
    // Cycles location as a mock interaction
    const locations = ["Madhapur, Hyderabad", "Gachibowli, Hyderabad", "Jubilee Hills, Hyderabad", "Kondapur, Hyderabad"];
    const currentIndex = locations.indexOf(location);
    const nextIndex = (currentIndex + 1) % locations.length;
    setLocation(locations[nextIndex]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? "all" : categoryId);
  };

  // ── Filtered Listings ──────────────────────────────────────────────────────
  const filteredPopular = useMemo(() => {
    return POPULAR_RESTAURANTS.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredFeatured = useMemo(() => {
    return FEATURED_RESTAURANTS.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <HomeHeader 
        location={location} 
        onLocationClick={handleLocationClick}
        onSearchClick={() => {
          const el = document.getElementById("search-input");
          el?.focus();
        }}
        onNotificationClick={() => alert("Notifications coming soon!")}
      />

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        
        {/* ── Greeting Banner ────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <h2 className={styles.greeting}>
            Hello Foodie, <br />
            Find your <span className={styles.greetingAccent}>Best Taste!</span>
          </h2>
          <p className={styles.greetingSub}>Delivering hot meals straight to your doorstep</p>
        </section>

        {/* ── Search Bar ─────────────────────────────────────────────────────── */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <div className={styles.searchIconWrap}>
              <Search size={18} />
            </div>
            <input
              id="search-input"
              type="text"
              placeholder="Search for biryani, mandi, cafés..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
              aria-label="Search food and restaurants"
            />
            {searchQuery && (
              <button 
                onClick={handleClearSearch} 
                className={styles.clearBtn}
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className={styles.filterBtn} aria-label="Open filter settings">
            <SlidersHorizontal size={20} color="#fff" />
          </button>
        </div>

        {/* ── Horizontal Categories ───────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="categories-heading">
          <div className={styles.sectionHeader}>
            <h3 id="categories-heading" className={styles.sectionTitle}>What's on your mind?</h3>
          </div>
          <div className={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`${styles.categoryChip} ${selectedCategory === cat.id ? styles.categoryChipActive : ""}`}
                aria-pressed={selectedCategory === cat.id}
              >
                <span className={styles.categoryEmoji}>{cat.emoji}</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Featured Carousel ──────────────────────────────────────────────── */}
        {filteredFeatured.length > 0 && (
          <section className={styles.section} aria-labelledby="featured-heading">
            <div className={styles.sectionHeader}>
              <h3 id="featured-heading" className={styles.sectionTitle}>Featured Culinary Gems</h3>
              <button className={styles.seeAllBtn} onClick={() => alert("See all featured restaurants")}>See All</button>
            </div>
            <div className={styles.featuredScroll}>
              {filteredFeatured.map((restaurant) => (
                <div key={restaurant.id} className={styles.featuredCard}>
                  <div className={styles.featuredImageWrap}>
                    <span className={styles.featuredEmoji}>{restaurant.emoji}</span>
                    <div className={styles.featuredOverlay} />
                    {restaurant.promo && (
                      <span className={styles.featuredPromo}>{restaurant.promo}</span>
                    )}
                    {restaurant.isOpen ? (
                      <span className={styles.featuredOpenBadge}>OPEN</span>
                    ) : (
                      <span className={styles.featuredClosedBadge}>CLOSED</span>
                    )}
                  </div>
                  <div className={styles.featuredBody}>
                    <h4 className={styles.featuredName}>{restaurant.name}</h4>
                    <p className={styles.featuredCuisine}>{restaurant.cuisine}</p>
                    <div className={styles.featuredMeta}>
                      <div className={styles.ratingPill}>
                        <span>⭐</span>
                        <span className={styles.ratingValue}>{restaurant.rating}</span>
                      </div>
                      <span className={styles.metaDot} />
                      <div className={styles.metaItem}>
                        <Clock size={12} />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      <span className={styles.metaDot} />
                      <div className={styles.metaItem}>
                        <span>{restaurant.distance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Section Divider ────────────────────────────────────────────────── */}
        <div className={styles.sectionDivider} />

        {/* ── Popular Restaurants List ───────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="popular-heading">
          <div className={styles.sectionHeader}>
            <h3 id="popular-heading" className={styles.sectionTitle}>Popular Restaurants Near You</h3>
            <button className={styles.seeAllBtn} onClick={() => alert("See all popular restaurants")}>See All</button>
          </div>

          {filteredPopular.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#6B7280" }}>
              <SearchCheck size={48} style={{ margin: "0 auto 12px", opacity: 0.5, color: "#FF6B35" }} />
              <p style={{ fontSize: "14px", fontWeight: 500 }}>No restaurants found matching details</p>
              <button 
                onClick={() => { handleClearSearch(); setSelectedCategory("all"); }} 
                style={{ marginTop: "12px", background: "none", border: "none", color: "#FF6B35", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div>
              {filteredPopular.map((restaurant) => (
                <div key={restaurant.id} className={styles.restaurantCard} style={{ opacity: restaurant.isOpen ? 1 : 0.6 }}>
                  <div className={styles.cardImageWrap}>
                    <span className={styles.cardEmoji}>{restaurant.emoji}</span>
                    {restaurant.isOpen ? (
                      <span className={`${styles.cardBadge} ${styles.cardBadgeOpen}`}>OPEN</span>
                    ) : (
                      <span className={`${styles.cardBadge} ${styles.cardBadgeClosed}`}>CLOSED</span>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardName}>{restaurant.name}</h4>
                    <p className={styles.cardCuisine}>{restaurant.cuisine}</p>
                    
                    <div className={styles.cardMeta}>
                      <div className={styles.cardRating}>
                        <Star size={12} fill="#FFAB40" stroke="#FFAB40" />
                        <span>{restaurant.rating}</span>
                      </div>
                      <span style={{ color: "#374151" }}>•</span>
                      <div className={styles.cardMetaItem}>
                        <Clock size={11} />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      <span style={{ color: "#374151" }}>•</span>
                      <span className={styles.cardMetaItem}>{restaurant.distance}</span>
                      <span style={{ color: "#374151" }}>•</span>
                      <span className={styles.cardMetaItem}>{restaurant.avgPrice}</span>
                    </div>

                    {restaurant.promo && (
                      <div>
                        <span className={styles.cardPromo}>
                          <Percent size={10} style={{ marginRight: "2px" }} />
                          {restaurant.promo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom Navigation ────────────────────────────────────────────────── */}
      <nav className={styles.bottomNav} aria-label="Main Navigation">
        <button 
          onClick={() => router.push("/")} 
          className={`${styles.navItem} ${activeTab === "home" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "home" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {activeTab === "home" && <span className={styles.navActiveIndicator} />}
            <Compass size={22} />
          </div>
          <span className={styles.navLabel}>Explore</span>
        </button>

        <button 
          onClick={() => setActiveTab("search")} 
          className={`${styles.navItem} ${activeTab === "search" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "search" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {activeTab === "search" && <span className={styles.navActiveIndicator} />}
            <Search size={22} />
          </div>
          <span className={styles.navLabel}>Search</span>
        </button>

        <button 
          onClick={() => router.push("/cart")} 
          className={`${styles.navItem} ${activeTab === "cart" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "cart" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {activeTab === "cart" && <span className={styles.navActiveIndicator} />}
            <ShoppingBag size={22} />
            {cartItemCount > 0 && (
              <span className={styles.navBadge} aria-label={`${cartItemCount} items in cart`}>
                {cartItemCount}
              </span>
            )}
          </div>
          <span className={styles.navLabel}>Cart</span>
        </button>

        <button 
          onClick={() => router.push("/orders")} 
          className={`${styles.navItem} ${activeTab === "orders" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "orders" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {activeTab === "orders" && <span className={styles.navActiveIndicator} />}
            <ClipboardList size={22} />
          </div>
          <span className={styles.navLabel}>Orders</span>
        </button>

        <button 
          onClick={() => router.push("/profile")} 
          className={`${styles.navItem} ${activeTab === "profile" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "profile" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {activeTab === "profile" && <span className={styles.navActiveIndicator} />}
            <User size={22} />
          </div>
          <span className={styles.navLabel}>Profile</span>
        </button>
      </nav>
    </main>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Clock, 
  MapPin, 
  X,
  SlidersHorizontal,
  UtensilsCrossed,
  Sparkles
} from "lucide-react";
import styles from "./restaurant.module.css";
import { db, auth } from "@/lib/firebase/config";
import { signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock Data
// ─────────────────────────────────────────────────────────────────────────────

interface MenuItem {
  name: string;
  category: string;
  description: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisineList: string[]; // for structured filtering
  menuItems?: MenuItem[];
  rating: number;
  deliveryTime: number; // in mins (for sorting)
  distance: number; // in km (for details)
  costForOne: number; // in INR
  emoji: string;
  promo?: string;
}

const CUISINES = [
  "All",
  "Biryani",
  "Mandi",
  "South Indian",
  "Bakery",
  "Mughlai",
  "Arabian",
  "Desserts",
  "Indo-Chinese"
];

const RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Paradise Biryani",
    cuisineList: ["Biryani", "Mughlai"],
    rating: 4.8,
    deliveryTime: 25,
    distance: 2.4,
    costForOne: 300,
    emoji: "🍛",
    promo: "Free Delivery",
  },
  {
    id: "r2",
    name: "Shah Ghouse",
    cuisineList: ["Biryani", "Mandi", "Mughlai"],
    rating: 4.7,
    deliveryTime: 30,
    distance: 3.2,
    costForOne: 250,
    emoji: "🍗",
    promo: "50% OFF up to ₹100",
  },
  {
    id: "r3",
    name: "Cafe Niloufer",
    cuisineList: ["Bakery"],
    rating: 4.9,
    deliveryTime: 15,
    distance: 1.0,
    costForOne: 100,
    emoji: "☕",
    promo: "Trending #1",
  },
  {
    id: "r4",
    name: "Pista House",
    cuisineList: ["Bakery", "Desserts"],
    rating: 4.6,
    deliveryTime: 18,
    distance: 1.5,
    costForOne: 150,
    emoji: "🍰",
    promo: "Buy 1 Get 1 Free",
  },
  {
    id: "r5",
    name: "Bawarchi Restaurant",
    cuisineList: ["Biryani", "Mughlai"],
    rating: 4.7,
    deliveryTime: 35,
    distance: 4.2,
    costForOne: 280,
    emoji: "🍛",
    promo: "Flat ₹100 OFF",
  },
  {
    id: "r6",
    name: "Chutneys",
    cuisineList: ["South Indian"],
    rating: 4.5,
    deliveryTime: 20,
    distance: 2.1,
    costForOne: 200,
    emoji: "🥞",
  },
  {
    id: "r7",
    name: "Mehfil Restaurant",
    cuisineList: ["Biryani", "Mughlai"],
    rating: 4.6,
    deliveryTime: 28,
    distance: 3.7,
    costForOne: 220,
    emoji: "🍖",
    promo: "30% OFF",
  },
  {
    id: "r8",
    name: "Ice & Spice Mandi",
    cuisineList: ["Mandi", "Arabian"],
    rating: 4.4,
    deliveryTime: 26,
    distance: 2.8,
    costForOne: 350,
    emoji: "🍗",
  },
  {
    id: "r9",
    name: "Kritunga Restaurant",
    cuisineList: ["South Indian", "Mughlai"],
    rating: 4.3,
    deliveryTime: 32,
    distance: 3.5,
    costForOne: 270,
    emoji: "🌶️",
    promo: "Rayalaseema Special",
  },
  {
    id: "r10",
    name: "Concu Patisserie",
    cuisineList: ["Desserts", "Bakery"],
    rating: 4.8,
    deliveryTime: 22,
    distance: 4.0,
    costForOne: 400,
    emoji: "🧁",
  },
  {
    id: "r11",
    name: "Gourmet Chinese",
    cuisineList: ["Indo-Chinese"],
    rating: 4.2,
    deliveryTime: 24,
    distance: 2.6,
    costForOne: 180,
    emoji: "🥢",
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RestaurantListingPage() {
  const router = useRouter();

  // ── States ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "deliveryTime" | "none">("none");
  const [firestoreRestaurants, setFirestoreRestaurants] = useState<Restaurant[]>([]);

  React.useEffect(() => {
    let unsubscribeRestaurants = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setFirestoreRestaurants([]);
        return;
      }

      const q = query(collection(db, "restaurants"), orderBy("rating", "desc"));
      unsubscribeRestaurants = onSnapshot(q, async (snap) => {
        const restaurantPromises = snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          const cuisinesList: string[] = Array.isArray(data.cuisine) 
            ? data.cuisine 
            : (typeof data.cuisine === 'string' ? data.cuisine.split(',').map((c: string) => c.trim()) : []);

          let menuItemsList: MenuItem[] = [];
          try {
            const menuSnap = await getDocs(collection(db, "restaurants", docSnap.id, "menuItems"));
            menuSnap.forEach(itemDoc => {
              const itemData = itemDoc.data();
              const name = itemData.name || "";
              const category = itemData.category || "";
              const description = itemData.description || "";
              menuItemsList.push({ name, category, description });
            });
          } catch (err) {
            console.error("Error loading menu items for listing:", docSnap.id, err);
          }

          return {
            id: docSnap.id,
            name: data.name || "Unnamed Restaurant",
            cuisineList: cuisinesList.length > 0 ? cuisinesList : ["Indian"],
            menuItems: menuItemsList,
            rating: data.rating || 4.5,
            deliveryTime: data.deliveryTime || 30,
            distance: parseFloat(data.distance || (1.5 + Math.random() * 3).toFixed(1)),
            costForOne: data.minOrder || 200,
            emoji: data.logo || "🍽️",
            promo: data.promo || ""
          };
        });
        const mapped = await Promise.all(restaurantPromises);
        setFirestoreRestaurants(mapped);
      }, (err) => {
        console.error("Error with restaurants onSnapshot subscription:", err);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRestaurants();
    };
  }, []);

  // ── Filter & Sort Logic ────────────────────────────────────────────────────
  const processedRestaurants = useMemo(() => {
    // Combine mock RESTAURANTS list and firestore list
    const combined = [...firestoreRestaurants];
    // Add mock if they don't exist in firestore list
    RESTAURANTS.forEach(mockR => {
      if (!combined.some(r => r.id === mockR.id)) {
        combined.push(mockR);
      }
    });

    let result = combined;

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisineList.some((c) => c.toLowerCase().includes(q)) ||
          (r.menuItems && r.menuItems.some((item) =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          ))
      );
    }

    // 2. Filter by Cuisine
    if (selectedCuisine !== "All") {
      result = result.filter((r) => r.cuisineList.includes(selectedCuisine));
    }

    // 3. Sorting
    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "deliveryTime") {
      result.sort((a, b) => a.deliveryTime - b.deliveryTime);
    }

    return result;
  }, [firestoreRestaurants, searchQuery, selectedCuisine, sortBy]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCuisine("All");
    setSortBy("none");
  };

  return (
    <main className={styles.page}>
      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/")} 
          className={styles.backBtn}
          aria-label="Back to home page"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>All Restaurants</h1>
      </header>

      {/* ── Scrollable content ───────────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        
        {/* ── Search Input ───────────────────────────────────────────────────── */}
        <section className={styles.searchContainer}>
          <div className={styles.searchField}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search dishes or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search within restaurants list"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className={styles.clearBtn}
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        {/* ── Cuisine Filters Section ────────────────────────────────────────── */}
        <section className={styles.filterSection} aria-labelledby="cuisine-filters-label">
          <h2 id="cuisine-filters-label" className={styles.filterHeading}>Cuisine Type</h2>
          <div className={styles.horizontalScroll}>
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`${styles.chip} ${selectedCuisine === cuisine ? styles.chipActive : ""}`}
                aria-pressed={selectedCuisine === cuisine}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </section>

        {/* ── Sorting Section ────────────────────────────────────────────────── */}
        <section className={styles.filterSection} aria-labelledby="sorting-options-label">
          <h2 id="sorting-options-label" className={styles.filterHeading}>Sort By</h2>
          <div className={styles.horizontalScroll}>
            <button
              onClick={() => setSortBy(sortBy === "rating" ? "none" : "rating")}
              className={`${styles.chip} ${sortBy === "rating" ? styles.chipActive : ""}`}
              aria-pressed={sortBy === "rating"}
            >
              ⭐ Top Rated
            </button>
            <button
              onClick={() => setSortBy(sortBy === "deliveryTime" ? "none" : "deliveryTime")}
              className={`${styles.chip} ${sortBy === "deliveryTime" ? styles.chipActive : ""}`}
              aria-pressed={sortBy === "deliveryTime"}
            >
              ⚡ Fastest Delivery
            </button>
          </div>
        </section>

        {/* ── Results Header ─────────────────────────────────────────────────── */}
        <div className={styles.resultsCountRow}>
          <span className={styles.resultsCount}>
            Showing {processedRestaurants.length} restaurant{processedRestaurants.length !== 1 ? "s" : ""}
          </span>
          {(searchQuery || selectedCuisine !== "All" || sortBy !== "none") && (
            <button 
              onClick={handleClearFilters}
              className={styles.resetLink}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Restaurants Card List ──────────────────────────────────────────── */}
        {processedRestaurants.length === 0 ? (
          <section className={styles.emptyState}>
            <UtensilsCrossed size={48} style={{ opacity: 0.3, color: "#FF6B35" }} />
            <p className={styles.emptyText}>No restaurants match your filters.</p>
            <button 
              onClick={handleClearFilters} 
              className={styles.resetLink}
            >
              Reset search criteria
            </button>
          </section>
        ) : (
          <section className={styles.listContainer} aria-label="Restaurant listings">
            {processedRestaurants.map((restaurant) => (
              <div 
                key={restaurant.id} 
                className={styles.restaurantCard}
                onClick={() => {
                  const url = searchQuery
                    ? `/restaurant/${restaurant.id}?search=${encodeURIComponent(searchQuery)}`
                    : `/restaurant/${restaurant.id}`;
                  router.push(url);
                }}
                role="button"
                tabIndex={0}
              >
                {/* Left side: Styled Image container */}
                <div className={styles.imageWrap}>
                  {restaurant.emoji && (restaurant.emoji.startsWith("http") || restaurant.emoji.startsWith("data:image")) && 
                   !restaurant.emoji.includes("placeholder.com") && !restaurant.emoji.includes("holder.com") ? (
                    <img 
                      src={restaurant.emoji} 
                      alt={restaurant.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=80&q=80";
                      }}
                    />
                  ) : (
                    <span className={styles.emoji} role="img" aria-label={restaurant.name}>
                      {restaurant.emoji && !restaurant.emoji.includes("http") ? restaurant.emoji : "🍽️"}
                    </span>
                  )}
                </div>

                {/* Right side: Detailed info */}
                <div className={styles.infoBlock}>
                  <div className={styles.nameRow}>
                    <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                    <div className={styles.ratingBadge}>
                      <Star size={11} fill="#FFAB40" stroke="#FFAB40" />
                      <span>{restaurant.rating}</span>
                    </div>
                  </div>

                  <p className={styles.cuisines}>{restaurant.cuisineList.join(", ")}</p>

                  {searchQuery && (() => {
                    const matchedItem = restaurant.menuItems?.find(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.description.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (matchedItem) {
                      return (
                        <div style={{ marginTop: "4px", fontSize: "11px", color: "#FF6B35", fontWeight: 600 }}>
                          Matched item: {matchedItem.name}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Clock size={12} />
                      <span>{restaurant.deliveryTime} mins</span>
                    </div>
                    <span className={styles.metaDot} />
                    <div className={styles.metaItem}>
                      <MapPin size={12} />
                      <span>{restaurant.distance} km</span>
                    </div>
                    <span className={styles.metaDot} />
                    <span>₹{restaurant.costForOne} for one</span>
                  </div>

                  {restaurant.promo && (
                    <span className={styles.promoBadge}>
                      <Sparkles size={9} style={{ marginRight: "2px" }} />
                      {restaurant.promo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

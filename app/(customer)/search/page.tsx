"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, Clock, ChevronRight, Compass, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./search.module.css";

import { db, auth } from "@/lib/firebase/config";
import { signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, query as fsQuery, orderBy, getDocs } from "firebase/firestore";
import { SearchRestaurant, matchSearch } from "@/lib/searchHelper";

interface SearchResult {
  id: string;
  name: string;
  type: "restaurant" | "dish";
  meta: string; // e.g. "Biryani • ₹380" or "Fast Food • 4.8 Rating"
  emoji: string;
  restaurantId?: string; // pointer to go to restaurant detail page
}

const TRENDING_DISHES = ["Chicken Biryani", "Ginger Chai", "Shawarma", "Dosas", "Mandi", "Apricot Delight"];

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([
    "Paradise Biryani",
    "Chai",
    "Mandi"
  ]);
  const [firestoreRestaurants, setFirestoreRestaurants] = useState<SearchRestaurant[]>([]);

  React.useEffect(() => {
    let unsubscribeRestaurants = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setFirestoreRestaurants([]);
        return;
      }

      const q = fsQuery(collection(db, "restaurants"), orderBy("rating", "desc"));
      unsubscribeRestaurants = onSnapshot(q, async (snap) => {
        const restaurantPromises = snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          const cuisinesList: string[] = Array.isArray(data.cuisine) 
            ? data.cuisine 
            : (typeof data.cuisine === 'string' ? data.cuisine.split(',').map((c: string) => c.trim()) : []);

          let menuItemsList: any[] = [];
          try {
            const menuSnap = await getDocs(collection(db, "restaurants", docSnap.id, "menuItems"));
            menuSnap.forEach(itemDoc => {
              const itemData = itemDoc.data();
              const name = itemData.name || "";
              const category = itemData.category || "";
              const description = itemData.description || "";
              const price = itemData.price || 0;
              menuItemsList.push({ name, category, description, price });
            });
          } catch (err) {
            console.error("Error loading menu items for listing:", docSnap.id, err);
          }

          return {
            id: docSnap.id,
            name: data.name || "Unnamed Restaurant",
            cuisine: cuisinesList.join(", ") || "Indian",
            category: data.category || cuisinesList[0] || "Indian",
            menuItems: menuItemsList,
            rating: data.rating || 4.5,
            deliveryTime: `${data.deliveryTime || 30} mins`,
            distance: `${data.distance || 2.4} km`,
            avgPrice: `₹${data.minOrder || 200} for one`,
            emoji: data.logo || "🍽️",
            isOpen: data.isOpen !== undefined ? data.isOpen : true
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

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();

    const results: SearchResult[] = [];

    firestoreRestaurants.forEach(r => {
      // If the restaurant name matches or its cuisine/category matches, we display the restaurant
      const matchesRestaurant = r.name.toLowerCase().includes(term) ||
                               r.cuisine.toLowerCase().includes(term) ||
                               r.category.toLowerCase().includes(term);

      if (matchesRestaurant) {
        results.push({
          id: r.id,
          name: r.name,
          type: "restaurant",
          meta: `${r.cuisine} • ⭐ ${r.rating}`,
          emoji: r.emoji,
          restaurantId: r.id
        });
      }

      // Check containing menu items
      r.menuItems?.forEach(item => {
        if (item.name.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term) || 
            item.description.toLowerCase().includes(term)) {
          // Add as dish result
          results.push({
            id: `${r.id}_${item.name}`,
            name: item.name,
            type: "dish",
            meta: `${r.name} • ₹${item.price}`,
            emoji: "🍛",
            restaurantId: r.id
          });
        }
      });
    });

    return results;
  }, [firestoreRestaurants, query]);

  const handleSelectKeyword = (keyword: string) => {
    setQuery(keyword);
    // Add to recents
    if (!recents.includes(keyword)) {
      setRecents([keyword, ...recents.slice(0, 4)]);
    }
  };

  const handleRemoveRecent = (recent: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecents(prev => prev.filter(r => r !== recent));
  };

  const handleResultClick = (item: SearchResult) => {
    if (item.restaurantId) {
      router.push(`/restaurant/${item.restaurantId}?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/");
    }
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
        <h1 className={styles.headerTitle}>Search Foods</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <span className={styles.searchIconWrap}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search for restaurants, dishes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className={styles.clearBtn}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion & History views (only if query is empty) */}
        {!query ? (
          <>
            {/* Recent Searches */}
            {recents.length > 0 && (
              <section style={{ marginBottom: "20px" }}>
                <h2 className={styles.sectionTitle}>Recent Searches</h2>
                <div className={styles.suggestionList}>
                  {recents.map((recent) => (
                    <div 
                      key={recent}
                      onClick={() => handleSelectKeyword(recent)}
                      className={styles.suggestionItem}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#9CA3AF" }}>
                        <Clock size={14} />
                        <span className={styles.suggestionText}>{recent}</span>
                      </div>
                      <button 
                        onClick={(e) => handleRemoveRecent(recent, e)}
                        className={styles.clearBtn}
                        style={{ color: "#4B5563" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Tags */}
            <section>
              <h2 className={styles.sectionTitle}>Trending Searches</h2>
              <div className={styles.tagCloud}>
                {TRENDING_DISHES.map((dish) => (
                  <button
                    key={dish}
                    onClick={() => handleSelectKeyword(dish)}
                    className={`${styles.tag} ${styles.trendingTag}`}
                  >
                    🔥 {dish}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Live Results Block */
          <section>
            <h2 className={styles.sectionTitle}>Search Results</h2>
            {filteredResults.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3 className={styles.emptyTitle}>No matches found</h3>
                <p className={styles.emptyDesc}>We couldn't find anything matching "{query}". Try checking your spelling.</p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                {filteredResults.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => handleResultClick(item)}
                    className={styles.resultCard}
                  >
                    <div className={styles.resultEmoji}>{item.emoji}</div>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultName}>{item.name}</span>
                      <span className={styles.resultMeta}>{item.meta}</span>
                    </div>
                    <ChevronRight size={16} className={styles.suggestionAction} />
                  </div>
                ))}
              </div>
            )}
          </section>
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

        <button className={`${styles.navItem} ${styles.navItemActive}`}>
          <div className={styles.navIconWrap}>
            <span className={styles.navActiveIndicator} />
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

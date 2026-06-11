"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, Clock, ChevronRight, Compass, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./search.module.css";

interface SearchResult {
  id: string;
  name: string;
  type: "restaurant" | "dish";
  meta: string; // e.g. "Biryani • ₹380" or "Fast Food • 4.8 Rating"
  emoji: string;
}

const MOCK_DATA: SearchResult[] = [
  { id: "s-1", name: "Paradise Biryani", type: "restaurant", meta: "Hyderabadi Biryani • ⭐ 4.8", emoji: "🍛" },
  { id: "s-2", name: "Special Chicken Biryani", type: "dish", meta: "Paradise Biryani • ₹380", emoji: "🍛" },
  { id: "s-3", name: "Cafe Niloufer", type: "restaurant", meta: "Chai & Bakery • ⭐ 4.9", emoji: "☕" },
  { id: "s-4", name: "Osmania Biscuits", type: "dish", meta: "Cafe Niloufer • ₹150", emoji: "🍪" },
  { id: "s-5", name: "Bun Maska", type: "dish", meta: "Cafe Niloufer • ₹80", emoji: "🥯" },
  { id: "s-6", name: "Shah Ghouse", type: "restaurant", meta: "Biryani & Mandi • ⭐ 4.7", emoji: "🍗" },
  { id: "s-7", name: "Chicken Mandi", type: "dish", meta: "Shah Ghouse • ₹510", emoji: "🍗" }
];

const TRENDING_DISHES = ["Chicken Biryani", "Ginger Chai", "Shawarma", "Dosas", "Mandi", "Apricot Delight"];

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([
    "Paradise Biryani",
    "Chai",
    "Mandi"
  ]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    return MOCK_DATA.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.meta.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

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
    alert(`🔍 Opening detail page for ${item.name} (${item.type})`);
    if (item.type === "restaurant") {
      router.push(`/restaurant/${item.id}`);
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

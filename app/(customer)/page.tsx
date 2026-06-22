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
  Percent
} from "lucide-react";
import HomeHeader from "./HomeHeader";
import styles from "./home.module.css";
import { STATE_LOCATIONS_DATABASE, searchLocations, ALL_CITIES_LIST } from "@/lib/locationDb";
import { db, auth } from "@/lib/firebase/config";
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { matchSearch } from "@/lib/searchHelper";

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
  cuisine: string;
  category: string;
  offeredCategories?: string[];
  menuItems?: MenuItem[];
  rating: number;
  deliveryTime: string; // e.g. "20-25 mins"
  distance: string; // e.g. "1.8 km"
  avgPrice: string; // e.g. "₹200 for one"
  emoji: string;
  isOpen: boolean;
  promo?: string;
  city?: string;
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
    id: "r1",
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
    id: "r2",
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
    id: "r4",
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
    id: "r3",
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
    id: "r5",
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
    id: "r6",
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
    id: "r7",
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
    id: "r8",
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
  const [location, setLocation] = useState("Gachibowli, Hyderabad");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("home");
  const [firestoreRestaurants, setFirestoreRestaurants] = useState<Restaurant[]>([]);
  
  // Location Selector Picker States
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; text: string; city: string }>>([]);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [newAddressText, setNewAddressText] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("Hyderabad");

  // Load selected location and saved addresses from localStorage on mount
  React.useEffect(() => {
    const savedLoc = localStorage.getItem("fad_selected_address");
    if (savedLoc) {
      setLocation(savedLoc);
    }
    const savedAddrs = localStorage.getItem("fad_saved_addresses");
    if (savedAddrs) {
      try {
        setSavedAddresses(JSON.parse(savedAddrs));
      } catch (e) {
        setDefaultSavedAddresses();
      }
    } else {
      setDefaultSavedAddresses();
    }
  }, []);

  React.useEffect(() => {
    let unsubscribeRestaurants: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeRestaurants) {
        unsubscribeRestaurants();
        unsubscribeRestaurants = null;
      }

      if (!user) {
        setFirestoreRestaurants([]);
        return;
      }

      const q = query(
        collection(db, "restaurants"),
        where("status", "==", "approved")
      );
      unsubscribeRestaurants = onSnapshot(q, async (snap) => {
        const restaurantPromises = snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          const cuisinesList = Array.isArray(data.cuisine) 
            ? data.cuisine 
            : (typeof data.cuisine === 'string' ? data.cuisine.split(',').map(c => c.trim()) : []);

          let offeredCategories = new Set<string>();
          let menuItemsList: MenuItem[] = [];
          try {
            const menuSnap = await getDocs(collection(db, "restaurants", docSnap.id, "menuItems"));
            menuSnap.forEach(itemDoc => {
              const itemData = itemDoc.data();
              const name = itemData.name || "";
              const category = itemData.category || "";
              const description = itemData.description || "";
              
              menuItemsList.push({ name, category, description });

              if (category) {
                offeredCategories.add(category.toLowerCase());
              }
              if (name) {
                const itemName = name.toLowerCase();
                if (itemName.includes("biryani")) offeredCategories.add("biryani");
                if (itemName.includes("mandi")) offeredCategories.add("mandi");
                if (itemName.includes("shawarma")) offeredCategories.add("shawarma");
                if (itemName.includes("dosa")) offeredCategories.add("south-indian");
              }
            });
          } catch (err) {
            console.error("Error loading menu items categories for:", docSnap.id, err);
          }

          let derivedCategory = "all";
          if (cuisinesList.length > 0) {
            const firstCuisine = cuisinesList[0].toLowerCase();
            if (firstCuisine.includes("biryani")) {
              derivedCategory = "biryani";
            } else if (firstCuisine.includes("mandi")) {
              derivedCategory = "mandi";
            } else if (firstCuisine.includes("shawarma")) {
              derivedCategory = "shawarma";
            } else if (firstCuisine.includes("south indian") || firstCuisine.includes("dosa")) {
              derivedCategory = "south-indian";
            } else if (firstCuisine.includes("chai") || firstCuisine.includes("tea") || firstCuisine.includes("cafe")) {
              derivedCategory = "chai";
            } else if (firstCuisine.includes("dessert") || firstCuisine.includes("sweet") || firstCuisine.includes("bakery") || firstCuisine.includes("cake")) {
              derivedCategory = "desserts";
            } else {
              derivedCategory = firstCuisine;
            }
          }

          return {
            id: docSnap.id,
            name: data.name || "Unnamed Restaurant",
            cuisine: cuisinesList.join(", ") || "Indian",
            category: derivedCategory,
            offeredCategories: Array.from(offeredCategories),
            menuItems: menuItemsList,
            rating: data.rating || 4.5,
            deliveryTime: `${data.deliveryTime || 30} mins`,
            distance: `${data.distance || (1.5 + Math.random() * 3).toFixed(1)} km`,
            avgPrice: `₹${data.minOrder || 200} for one`,
            emoji: data.logo || "🍽️",
            isOpen: data.isOpen !== undefined ? data.isOpen : true,
            promo: data.promo || "",
            city: data.address?.city || "Hyderabad"
          };
        });
        const mapped = await Promise.all(restaurantPromises);
        mapped.sort((a, b) => b.rating - a.rating);
        setFirestoreRestaurants(mapped);
      }, (err) => {
        console.error("Error with restaurants onSnapshot subscription:", err);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRestaurants) {
        unsubscribeRestaurants();
      }
    };
  }, []);

  const setDefaultSavedAddresses = () => {
    const defaults = [
      { id: "addr-home", label: "Home", text: "Flat 304, Srinivasa Heights, Madhapur", city: "Hyderabad" },
      { id: "addr-work", label: "Work", text: "Phase 2, T-Hub building, Inorbit Mall Road, Madhapur", city: "Hyderabad" }
    ];
    setSavedAddresses(defaults);
    localStorage.setItem("fad_saved_addresses", JSON.stringify(defaults));
  };

  const selectLocation = (locStr: string) => {
    setLocation(locStr);
    localStorage.setItem("fad_selected_address", locStr);
    setIsLocationModalOpen(false);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) {
      alert("Please enter full address details");
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      label: newAddressLabel,
      text: newAddressText,
      city: newAddressCity
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    localStorage.setItem("fad_saved_addresses", JSON.stringify(updated));
    
    // Auto-select the newly added address
    const fullText = `${newAddressText}, ${newAddressCity}`;
    selectLocation(fullText);

    // Reset inputs
    setNewAddressText("");
    setIsAddingNewAddress(false);
  };

  // Filter Sheet/Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    rating45: false,
    biryani: false,
    mandi: false,
    shawarma: false,
    vegetarian: false
  });
  const [appliedFilters, setAppliedFilters] = useState({
    rating45: false,
    biryani: false,
    mandi: false,
    shawarma: false,
    vegetarian: false
  });
  
  // Cart item count (mocked)
  const cartItemCount = 3;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
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

  // ── Filter Modal Actions ──────────────────────────────────────────────────
  const openFilterModal = () => {
    setTempFilters({ ...appliedFilters });
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const cleared = {
      rating45: false,
      biryani: false,
      mandi: false,
      shawarma: false,
      vegetarian: false
    };
    setTempFilters(cleared);
    setAppliedFilters(cleared);
  };

  // ── Filtered Listings ──────────────────────────────────────────────────────
  const activeCity = useMemo(() => {
    const match = ALL_CITIES_LIST.find(city => location.toLowerCase().includes(city.toLowerCase()));
    return match || "Hyderabad";
  }, [location]);

  // ── Filtered Listings ──────────────────────────────────────────────────────
  const filteredRestaurants = useMemo(() => {
    // Combine mock lists dynamically to establish single source of truth
    const ALL_RESTAURANTS = firestoreRestaurants;
    // Deduplicate items just in case
    const uniqueMap = new Map();
    ALL_RESTAURANTS.forEach(item => {
      uniqueMap.set(item.id, item);
    });
    const restaurantsList = Array.from(uniqueMap.values());

    return restaurantsList.filter((r) => {
      // 0. Filter by active city
      const restaurantCity = r.city || "Hyderabad";
      if (restaurantCity.toLowerCase() !== activeCity.toLowerCase()) {
        return false;
      }

      // 1. Text Search matching
      const matchesSearch = matchSearch(r, searchQuery);
      
      // 2. Category tag selection
      let matchesCategory = selectedCategory === "all";
      if (!matchesCategory) {
        const cuisineLower = r.cuisine.toLowerCase();
        const normCategory = selectedCategory.toLowerCase();
        
        if (r.category === selectedCategory) {
          matchesCategory = true;
        } else if (cuisineLower.includes(normCategory)) {
          matchesCategory = true;
        } else if (selectedCategory === "south-indian" && (cuisineLower.includes("south indian") || cuisineLower.includes("dosa"))) {
          matchesCategory = true;
        } else if (r.offeredCategories && r.offeredCategories.includes(selectedCategory)) {
          matchesCategory = true;
        }
      }

      // 3. Applied Filters
      if (appliedFilters.rating45 && r.rating < 4.5) return false;
      if (appliedFilters.biryani && !r.cuisine.toLowerCase().includes("biryani")) return false;
      if (appliedFilters.mandi && !r.cuisine.toLowerCase().includes("mandi")) return false;
      if (appliedFilters.shawarma && !r.cuisine.toLowerCase().includes("shawarma")) return false;
      
      // Chutneys is the default vegetarian mock spot (category: south-indian / id: r6)
      if (appliedFilters.vegetarian && r.id !== "r6") return false;

      return matchesSearch && matchesCategory;
    });
  }, [firestoreRestaurants, searchQuery, selectedCategory, appliedFilters, activeCity]);

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
        onFavoritesClick={() => router.push("/favorites")}
        onNotificationClick={() => router.push("/notifications")}
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
          <button 
            onClick={openFilterModal} 
            className={`${styles.filterBtn} ${Object.values(appliedFilters).some(Boolean) ? styles.filterBtnActive : ""}`} 
            aria-label="Open filter settings"
          >
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

        {/* ── Restaurants List ────────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="restaurants-heading">
          <div className={styles.sectionHeader}>
            <h3 id="restaurants-heading" className={styles.sectionTitle}>Restaurants Near You</h3>
            <button className={styles.seeAllBtn} onClick={() => alert("See all restaurants")}>See All</button>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#6B7280" }}>
              <Search size={48} style={{ margin: "0 auto 12px", opacity: 0.5, color: "#FF6B35" }} />
              {searchQuery || Object.values(appliedFilters).some(Boolean) || selectedCategory !== "all" ? (
                <>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>No restaurants found matching details</p>
                  <button 
                    onClick={() => { handleClearSearch(); setSelectedCategory("all"); clearFilters(); }} 
                    style={{ marginTop: "12px", background: "none", border: "none", color: "#FF6B35", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <p style={{ fontSize: "14px", fontWeight: 500 }}>
                  No restaurants available in <strong>{activeCity}</strong> yet.<br />
                  We are coming soon! 🚚
                </p>
              )}
            </div>
          ) : (
            <div>
              {filteredRestaurants.map((restaurant) => (
                <div 
                  key={restaurant.id} 
                  onClick={() => {
                    console.log("[Restaurant Navigation] Tapped restaurant card ID:", restaurant.id, "Name:", restaurant.name);
                    const url = searchQuery 
                      ? `/restaurant?id=${restaurant.id}&search=${encodeURIComponent(searchQuery)}`
                      : `/restaurant?id=${restaurant.id}`;
                    console.log("[Restaurant Navigation] Transitioning to URL:", url);
                    router.push(url);
                  }}
                  className={styles.restaurantCard} 
                  style={{ opacity: restaurant.isOpen ? 1 : 0.6, cursor: "pointer" }}
                >
                  <div className={styles.cardImageWrap}>
                    {restaurant.emoji && (restaurant.emoji.startsWith("http") || restaurant.emoji.startsWith("data:image")) && 
                     !restaurant.emoji.includes("placeholder.com") && !restaurant.emoji.includes("holder.com") ? (
                      <img 
                        src={restaurant.emoji} 
                        alt={restaurant.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80";
                        }}
                      />
                    ) : (
                      <span className={styles.cardEmoji}>{restaurant.emoji && !restaurant.emoji.includes("http") ? restaurant.emoji : "🍽️"}</span>
                    )}
                    {restaurant.isOpen ? (
                      <span className={`${styles.cardBadge} ${styles.cardBadgeOpen}`}>OPEN</span>
                    ) : (
                      <span className={`${styles.cardBadge} ${styles.cardBadgeClosed}`}>CLOSED</span>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardName}>{restaurant.name}</h4>
                    <p className={styles.cardCuisine}>{restaurant.cuisine}</p>
                    {searchQuery && (() => {
                      const matchedItem = restaurant.menuItems?.find((item: any) => 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      if (matchedItem) {
                        return (
                          <div style={{ marginTop: "4px", fontSize: "12px", color: "#FF6B35", fontWeight: 600 }}>
                            Matched item: {matchedItem.name}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
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
          onClick={() => router.push("/search")} 
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

      {/* ── Filter Sheet Overlay Modal ───────────────────────────────────────── */}
      {isFilterModalOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#121212',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Filter Restaurants</h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Options Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Rating 4.5+ */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={tempFilters.rating45}
                  onChange={(e) => setTempFilters({ ...tempFilters, rating45: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#E5E7EB', fontWeight: 500 }}>⭐ Rating 4.5+</span>
              </label>

              {/* Biryani */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={tempFilters.biryani}
                  onChange={(e) => setTempFilters({ ...tempFilters, biryani: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#E5E7EB', fontWeight: 500 }}>🍛 Biryani</span>
              </label>

              {/* Mandi */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={tempFilters.mandi}
                  onChange={(e) => setTempFilters({ ...tempFilters, mandi: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#E5E7EB', fontWeight: 500 }}>🍗 Mandi</span>
              </label>

              {/* Shawarma */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={tempFilters.shawarma}
                  onChange={(e) => setTempFilters({ ...tempFilters, shawarma: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#E5E7EB', fontWeight: 500 }}>🌯 Shawarma</span>
              </label>

              {/* Vegetarian */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={tempFilters.vegetarian}
                  onChange={(e) => setTempFilters({ ...tempFilters, vegetarian: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#E5E7EB', fontWeight: 500 }}>🥞 Vegetarian Only</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={clearFilters}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
              <button 
                onClick={applyFilters}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#FF6B35',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Selector Modal ────────────────────────────────────────── */}
      {isLocationModalOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsLocationModalOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#121212',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '85%',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Select Location</h3>
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* City Search Bar */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Search city (e.g. Mumbai, Delhi)..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              {locationSearchQuery && (
                <button 
                  onClick={() => setLocationSearchQuery("")}
                  style={{ background: 'none', border: 'none', color: '#FF6B35', fontSize: '13px', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Switch to Add Address Form or List */}
            {!isAddingNewAddress ? (
              <>
                {/* Saved Addresses Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Delivery Addresses</h4>
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => selectLocation(`${addr.text}, ${addr.city}`)}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: location === `${addr.text}, ${addr.city}` ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600, color: location === `${addr.text}, ${addr.city}` ? '#FF6B35' : '#fff' }}>
                        {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'} {addr.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{addr.text}, {addr.city}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'transparent',
                      color: '#FF6B35',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    + Add New Address
                  </button>
                </div>

                {/* Cities List Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cities By State Sugggestions</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                    {searchLocations(locationSearchQuery).map((stateLoc) => (
                      <div key={stateLoc.state} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#FF6B35', opacity: 0.8 }}>{stateLoc.state}</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {stateLoc.cities.map((city) => {
                            const isSelected = activeCity.toLowerCase() === city.name.toLowerCase() && !location.includes(',');
                            return (
                              <button
                                key={city.name}
                                onClick={() => selectLocation(city.name)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: isSelected ? '1px solid #FF6B35' : '1px solid rgba(255, 255, 255, 0.05)',
                                  backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isSelected ? '#FF6B35' : '#E5E7EB',
                                  fontSize: '12px',
                                  fontWeight: isSelected ? 600 : 500,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                🏙️ {city.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Add New Address Form */
              <form onSubmit={handleAddNewAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>Save New Address</h4>
                
                {/* Tag selector */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewAddressLabel(lbl)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: newAddressLabel === lbl ? '#FF6B35' : 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                <input 
                  type="text"
                  placeholder="Address Line (Flat, Building, Street)*"
                  required
                  value={newAddressText}
                  onChange={(e) => setNewAddressText(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />

                {/* City selector dropdown */}
                <select
                  value={newAddressCity}
                  onChange={(e) => setNewAddressCity(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#121212',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  {ALL_CITIES_LIST.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'transparent',
                      color: '#9CA3AF',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#FF6B35',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save & Select
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

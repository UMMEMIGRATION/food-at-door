"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  Plus, 
  Minus,
  Sparkles
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useCartStore } from "@/store/useCartStore";
import styles from "./details.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock Database
// ─────────────────────────────────────────────────────────────────────────────

interface MockRestaurant {
  id: string;
  name: string;
  cuisineList: string[];
  rating: number;
  deliveryTime: number;
  distance: number;
  costForOne: number;
  emoji: string;
  promo?: string;
}

const RESTAURANTS: MockRestaurant[] = [
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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
}

interface RestaurantDetails {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  emoji: string;
  categoriesList: string[];
  menuItems: MenuItem[];
}
// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RestaurantDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clientParams = useParams();
  const restaurantId = (clientParams?.id as string) || params?.id || "";
  const { items, addItem, removeItem, updateQuantity } = useCartStore();

  // ── State for fetched Firestore restaurant data ────────────────────────────
  const [dbRestaurant, setDbRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    console.log("[RestaurantDetails] useEffect triggered. ID:", restaurantId);
    async function loadRestaurant() {
      if (!restaurantId) {
        console.warn("[RestaurantDetails] No restaurantId found.");
        return;
      }
      try {
        console.log("[RestaurantDetails] Fetching doc for restaurantId:", restaurantId);
        const docRef = doc(db, "restaurants", restaurantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("[RestaurantDetails] Document retrieved:", data);
          
          // Get menu categories (safely)
          const catsList: string[] = ["Recommended"];
          try {
            console.log("[RestaurantDetails] Fetching subcollection menuCategories...");
            const catsSnap = await getDocs(collection(db, "restaurants", restaurantId, "menuCategories"));
            catsSnap.forEach((catDoc) => {
              const catName = catDoc.data().name;
              if (catName && !catsList.includes(catName)) {
                catsList.push(catName);
              }
            });
            console.log("[RestaurantDetails] Loaded categories list:", catsList);
          } catch (err) {
            console.error("[RestaurantDetails] Error loading menu categories:", err);
          }
 
          // Get menu items (safely)
          const itemsList: MenuItem[] = [];
          try {
            console.log("[RestaurantDetails] Fetching subcollection menuItems...");
            const itemsSnap = await getDocs(collection(db, "restaurants", restaurantId, "menuItems"));
            itemsSnap.forEach((itemDoc) => {
              const itemData = itemDoc.data();
              itemsList.push({
                id: itemDoc.id,
                name: itemData.name || "Unnamed Item",
                description: itemData.description || "",
                price: itemData.price || 0,
                category: itemData.category || "Recommended",
                emoji: itemData.image || "🍔"
              });
            });
            console.log("[RestaurantDetails] Loaded items count:", itemsList.length);
          } catch (err) {
            console.error("[RestaurantDetails] Error loading menu items:", err);
          }
 
          if (active) {
            setDbRestaurant({
              id: restaurantId,
              name: data.name || "Restaurant",
              description: data.description || "",
              rating: data.rating || 4.5,
              deliveryTime: `${data.deliveryTime || 30} mins`,
              distance: `${data.distance || 2.0} km`,
              emoji: data.logo || "🍽️",
              categoriesList: catsList,
              menuItems: itemsList
            });
          }
        } else {
          console.warn("[RestaurantDetails] Document does not exist in Firestore!");
        }
      } catch (err) {
        console.error("[RestaurantDetails] Error in loadRestaurant details fetch:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadRestaurant();
    return () => {
      active = false;
    };
  }, [restaurantId]);

  // ── Fetch Restaurant Details ───────────────────────────────────────────────
  const restaurant = useMemo(() => {
    return dbRestaurant || {
      id: "",
      name: "",
      description: "",
      rating: 0,
      deliveryTime: "",
      distance: "",
      emoji: "",
      categoriesList: [],
      menuItems: []
    };
  }, [dbRestaurant]);

  // ── States ─────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (restaurant.categoriesList.length > 0) {
      setActiveCategory(restaurant.categoriesList[0]);
    }
  }, [restaurant]);

  // Map Zustand store items belonging to this restaurant to a local lookup Record
  const cartLookup = useMemo(() => {
    const lookup: Record<string, number> = {};
    items.forEach((item) => {
      if (item.restaurantId === restaurant.id) {
        lookup[item.id] = item.quantity;
      }
    });
    return lookup;
  }, [items, restaurant.id]);

  // ── Cart Calculations ──────────────────────────────────────────────────────
  const { totalItems, totalPrice } = useMemo(() => {
    let itemsCount = 0;
    let priceSum = 0;

    items.forEach((item) => {
      if (item.restaurantId === restaurant.id) {
        itemsCount += item.quantity;
        priceSum += item.price * item.quantity;
      }
    });

    return { totalItems: itemsCount, totalPrice: priceSum };
  }, [items, restaurant.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = (item: MenuItem) => {
    const existingQty = cartLookup[item.id] || 0;
    if (existingQty > 0) {
      updateQuantity(item.id, existingQty + 1);
    } else {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        description: item.description,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    const existingQty = cartLookup[itemId] || 0;
    if (existingQty <= 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, existingQty - 1);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    // Smooth scroll to the target section
    const targetElement = document.getElementById(`category-section-${category}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Group menu items by category
  const categorizedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    
    // Group all items
    restaurant.menuItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    // Handle "Recommended" category (items with lower IDs or higher prices as mock)
    const recommendedItems = restaurant.menuItems.slice(0, 3);
    if (recommendedItems.length > 0) {
      groups["Recommended"] = recommendedItems;
    }

    return groups;
  }, [restaurant.menuItems]);

  // Filter categories which actually have menu items
  const activeCategories = useMemo(() => {
    const list = [...restaurant.categoriesList];
    // Filter out categories which are not in the categorizedMenu map
    return list.filter((c) => categorizedMenu[c] && categorizedMenu[c].length > 0);
  }, [restaurant.categoriesList, categorizedMenu]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "sans-serif",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#FF6B35",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Loading restaurant menu...</p>
      </div>
    );
  }

  if (!dbRestaurant) {
    // Check if it's a mock restaurant ID
    const isMock = restaurantId.startsWith("r");
    const mockInfo = isMock ? RESTAURANTS.find(r => r.id === restaurantId) : null;
    
    if (isMock && mockInfo) {
      // Lazy load/populate mock restaurant details to prevent screen flash/redirect
      const catsList = ["Recommended", ...mockInfo.cuisineList];
      const itemsList: MenuItem[] = [
        {
          id: `${restaurantId}-m1`,
          name: `${mockInfo.name} Special Dish`,
          description: "Our signature customer favorite freshly prepared.",
          price: mockInfo.costForOne,
          category: "Recommended",
          emoji: mockInfo.emoji
        }
      ];
      setDbRestaurant({
        id: restaurantId,
        name: mockInfo.name,
        description: `${mockInfo.name} delivers delicious ${mockInfo.cuisineList.join(", ")} right to your doorstep.`,
        rating: mockInfo.rating,
        deliveryTime: `${mockInfo.deliveryTime} mins`,
        distance: `${mockInfo.distance} km`,
        emoji: mockInfo.emoji,
        categoriesList: catsList,
        menuItems: itemsList
      });
      return null;
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "sans-serif",
          gap: "16px",
        }}
      >
        <p style={{ color: "#9CA3AF", fontSize: "16px" }}>Restaurant not found</p>
        <button 
          onClick={() => {
            const hasQueryId = typeof window !== "undefined" && window.location.search.includes("id=");
            if (hasQueryId) {
              router.push("/");
            } else {
              router.push("/restaurant");
            }
          }}
          style={{ background: "#FF6B35", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      
      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        
        {/* ── Banner Section ─────────────────────────────────────────────────── */}
        <section className={styles.bannerContainer}>
          <button 
            onClick={() => router.push("/restaurant")} 
            className={styles.backBtn}
            aria-label="Go back to restaurants list"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className={styles.bannerOverlay} />
          {restaurant.emoji && (restaurant.emoji.startsWith("http") || restaurant.emoji.startsWith("data:image")) && 
           !restaurant.emoji.includes("placeholder.com") && !restaurant.emoji.includes("holder.com") ? (
            <img 
              src={restaurant.emoji} 
              alt={restaurant.name} 
              className={styles.bannerEmoji}
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', background: '#1a1a1a', border: '2px solid #FF6B35' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className={styles.bannerEmoji} role="img" aria-label={restaurant.name}>
              {restaurant.emoji && !restaurant.emoji.includes("http") ? restaurant.emoji : "🍽️"}
            </span>
          )}
        </section>

        {/* ── Restaurant details card ────────────────────────────────────────── */}
        <section className={styles.detailsBlock}>
          <h1 className={styles.restaurantName}>{restaurant.name}</h1>
          
          <div className={styles.ratingRow}>
            <div className={styles.ratingBadge}>
              <Star size={12} fill="#FFAB40" stroke="#FFAB40" />
              <span>{restaurant.rating}</span>
            </div>
            <span className={styles.metaDot} />
            <div className={styles.metaItem}>
              <Clock size={13} />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <span className={styles.metaDot} />
            <div className={styles.metaItem}>
              <MapPin size={13} />
              <span>{restaurant.distance}</span>
            </div>
          </div>

          <p className={styles.description}>{restaurant.description}</p>
        </section>

        {/* ── Category scroll tags ────────────────────────────────────────────── */}
        {activeCategories.length > 0 && (
          <nav className={styles.categoriesSection} aria-label="Menu Categories">
            <div className={styles.categoriesScroll}>
              {activeCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`${styles.categoryTab} ${activeCategory === category ? styles.categoryTabActive : ""}`}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* ── Food Items Menu List ───────────────────────────────────────────── */}
        {activeCategories.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#6B7280" }}>
            <p style={{ fontSize: "16px", fontWeight: 500 }}>No items available</p>
          </div>
        ) : (
          activeCategories.map((category) => (
            <section 
              key={category} 
              id={`category-section-${category}`} 
              className={styles.menuSection}
              aria-labelledby={`category-title-${category}`}
            >
              <h2 id={`category-title-${category}`} className={styles.sectionTitle}>
                {category}
              </h2>
              
              <div>
                {(categorizedMenu[category] || []).map((item) => {
                  const qty = cartLookup[item.id] || 0;
                  return (
                    <div key={item.id} className={styles.itemCard}>
                      {/* Item info */}
                      <div className={styles.itemInfo}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <span className={styles.itemPrice}>₹{item.price}</span>
                        <p className={styles.itemDescription}>{item.description}</p>
                      </div>

                      {/* Image & add buttons */}
                      <div className={styles.itemImageOuter}>
                        <div className={styles.itemImageWrap}>
                          {item.emoji && (item.emoji.startsWith("http") || item.emoji.startsWith("data:image")) && 
                           !item.emoji.includes("placeholder.com") && !item.emoji.includes("holder.com") ? (
                            <img 
                              src={item.emoji} 
                              alt={item.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className={styles.itemEmoji} role="img" aria-label={item.name}>
                              {item.emoji && !item.emoji.includes("http") ? item.emoji : "🍔"}
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity Selector overlay */}
                        <div className={styles.addBtnContainer}>
                          {qty > 0 ? (
                            <div className={styles.qtySelector}>
                              <button 
                                onClick={() => handleRemoveFromCart(item.id)}
                                className={styles.qtyBtn}
                                aria-label="Reduce quantity"
                              >
                                <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className={styles.qtyValue} aria-label={`${qty} items selected`}>
                                {qty}
                              </span>
                              <button 
                                onClick={() => handleAddToCart(item)}
                                className={styles.qtyBtn}
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAddToCart(item)}
                              className={styles.addBtn}
                              aria-label={`Add ${item.name} to cart`}
                            >
                              ADD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Sticky Cart Bar (visible only if items are in cart) ───────────────── */}
      {totalItems > 0 && (
        <section className={styles.stickyCart} aria-label="Cart summary">
          <div className={styles.cartContent}>
            <div className={styles.cartInfo}>
              <span className={styles.cartItems}>{totalItems} item{totalItems !== 1 ? "s" : ""} added</span>
              <span className={styles.cartPrice}>₹{totalPrice}</span>
            </div>
            
            <button 
              onClick={() => router.push("/cart")}
              className={styles.viewCartBtn}
              aria-label="View shopping cart"
            >
              <span>View Cart</span>
              <ShoppingBag size={15} />
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

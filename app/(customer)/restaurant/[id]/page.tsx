"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import styles from "./details.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock Database
// ─────────────────────────────────────────────────────────────────────────────

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

const MOCK_RESTAURANT_DB: Record<string, RestaurantDetails> = {
  // Paradise Biryani
  r1: {
    id: "r1",
    name: "Paradise Biryani",
    description: "Legendary Hyderabadi Biryani serving authentic tastes since 1953. Famous for rich aroma and tender melt-in-mouth meat.",
    rating: 4.8,
    deliveryTime: "25 mins",
    distance: "2.4 km",
    emoji: "🍛",
    categoriesList: ["Recommended", "Biryani", "Starters", "Desserts"],
    menuItems: [
      {
        id: "r1_m1",
        name: "Special Chicken Biryani",
        description: "Fragrant basmati rice layered with succulent chicken, saffron, and traditional spices. Serves 1-2.",
        price: 380,
        category: "Biryani",
        emoji: "🍛"
      },
      {
        id: "r1_m2",
        name: "Special Mutton Biryani",
        description: "Perfectly cooked tender mutton pieces layered with spiced basmati rice. Serves 1-2.",
        price: 420,
        category: "Biryani",
        emoji: "🍛"
      },
      {
        id: "r1_m3",
        name: "Chicken Tikka Kabab",
        description: "Spicy clay-oven roasted chicken skewers. 8 pieces, served with mint chutney.",
        price: 310,
        category: "Starters",
        emoji: "🍢"
      },
      {
        id: "r1_m4",
        name: "Double Ka Meetha",
        description: "Traditional Hyderabadi bread pudding dessert cooked with milk, nuts, and cardamoms.",
        price: 120,
        category: "Desserts",
        emoji: "🍰"
      },
      {
        id: "r1_m5",
        name: "Qubani Ka Meetha",
        description: "Classic sweet dish made from dried apricots, served with fresh cream.",
        price: 140,
        category: "Desserts",
        emoji: "🍧"
      }
    ]
  },
  // Shah Ghouse
  r2: {
    id: "r2",
    name: "Shah Ghouse",
    description: "Home of rich spices and legendary Hyderabadi flavors. Renowned for authentic Dum Biryani and seasonal Haleem.",
    rating: 4.7,
    deliveryTime: "30 mins",
    distance: "3.2 km",
    emoji: "🍗",
    categoriesList: ["Recommended", "Biryani", "Haleem", "Starters"],
    menuItems: [
      {
        id: "r2_m1",
        name: "Shah Ghouse Chicken Biryani",
        description: "Authentic spicy chicken biryani cooked on slow flame (Dum). Serves 1.",
        price: 290,
        category: "Biryani",
        emoji: "🍛"
      },
      {
        id: "r2_m2",
        name: "Special Mutton Haleem",
        description: "Slow-cooked wheat, barley, and meat stew flavored with traditional ghee and spices.",
        price: 260,
        category: "Haleem",
        emoji: "🍲"
      },
      {
        id: "r2_m3",
        name: "Tandoori Chicken",
        description: "Classic spiced chicken grilled in a tandoor clay-oven. Half portion.",
        price: 280,
        category: "Starters",
        emoji: "🍗"
      },
      {
        id: "r2_m4",
        name: "Mutton Boti Kabab",
        description: "Skewered mutton pieces marinated in traditional aromatic spices and charcoal grilled.",
        price: 340,
        category: "Starters",
        emoji: "🍢"
      }
    ]
  },
  // Cafe Niloufer
  r3: {
    id: "r3",
    name: "Cafe Niloufer",
    description: "Hyderabad's favourite tea spot. Serving legendary Irani Chai, soft Bun Maska, and iconic Osmania Biscuits since 1978.",
    rating: 4.9,
    deliveryTime: "15 mins",
    distance: "1.0 km",
    emoji: "☕",
    categoriesList: ["Chai & Tea", "Bakery Specials"],
    menuItems: [
      {
        id: "r3_m1",
        name: "Niloufer Special Tea",
        description: "Rich, creamy, and aromatic Hyderabadi Irani Chai. Best paired with Osmania biscuits.",
        price: 50,
        category: "Chai & Tea",
        emoji: "☕"
      },
      {
        id: "r3_m2",
        name: "Bun Maska",
        description: "Freshly baked soft bun served with a generous layer of homemade butter.",
        price: 80,
        category: "Bakery Specials",
        emoji: "🍞"
      },
      {
        id: "r3_m3",
        name: "Osmania Biscuits Box",
        description: "Perfectly sweet and salty traditional biscuits. Box of 200g.",
        price: 150,
        category: "Bakery Specials",
        emoji: "🍪"
      },
      {
        id: "r3_m4",
        name: "Milk Rusk Box",
        description: "Twice-baked crispy bread rusks. Perfect for dipping in tea. Box of 250g.",
        price: 110,
        category: "Bakery Specials",
        emoji: "🥖"
      }
    ]
  }
};

// Default fallback database if matching ID is not found in routing
const DEFAULT_RESTAURANT: RestaurantDetails = {
  id: "default",
  name: "Hyderabadi Spice",
  description: "Authentic spices and traditional meals, brought to your doorstep with premium ingredients.",
  rating: 4.5,
  deliveryTime: "22 mins",
  distance: "1.8 km",
  emoji: "🍽️",
  categoriesList: ["Recommended", "Main Course", "Beverages"],
  menuItems: [
    {
      id: "def_m1",
      name: "Hyderabadi Dum Biryani",
      description: "Basmati rice cooked in slow steam with traditional spices.",
      price: 250,
      category: "Main Course",
      emoji: "🍛"
    },
    {
      id: "def_m2",
      name: "Paneer Butter Masala",
      description: "Cottage cheese cubes in a creamy tomato sauce.",
      price: 220,
      category: "Main Course",
      emoji: "🧀"
    },
    {
      id: "def_m3",
      name: "Irani Chai",
      description: "Authentic thick and creamy tea.",
      price: 40,
      category: "Beverages",
      emoji: "☕"
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RestaurantDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // ── Fetch Restaurant Details ───────────────────────────────────────────────
  const restaurant = useMemo(() => {
    return MOCK_RESTAURANT_DB[params.id] || DEFAULT_RESTAURANT;
  }, [params.id]);

  // ── States ─────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(restaurant.categoriesList[0] || "");
  const [cart, setCart] = useState<Record<string, number>>({});

  // ── Cart Calculations ──────────────────────────────────────────────────────
  const { totalItems, totalPrice } = useMemo(() => {
    let itemsCount = 0;
    let priceSum = 0;

    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = restaurant.menuItems.find((m) => m.id === itemId);
      if (item) {
        itemsCount += qty;
        priceSum += item.price * qty;
      }
    });

    return { totalItems: itemsCount, totalPrice: priceSum };
  }, [cart, restaurant.menuItems]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] <= 1) {
        delete next[itemId];
      } else {
        next[itemId] -= 1;
      }
      return next;
    });
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
          <span className={styles.bannerEmoji} role="img" aria-label={restaurant.name}>
            {restaurant.emoji}
          </span>
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
        {activeCategories.map((category) => (
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
                const qty = cart[item.id] || 0;
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
                        <span className={styles.itemEmoji} role="img" aria-label={item.name}>
                          {item.emoji}
                        </span>
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
                              onClick={() => handleAddToCart(item.id)}
                              className={styles.qtyBtn}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleAddToCart(item.id)}
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
        ))}
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
              onClick={() => alert("Checkout coming soon!")}
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

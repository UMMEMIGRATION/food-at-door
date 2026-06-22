"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { auth, db } from "../../../lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  increment
} from "firebase/firestore";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  X, 
  Compass, 
  ShoppingBag, 
  ClipboardList, 
  User,
  Percent,
  SearchCheck
} from "lucide-react";
import HomeHeader from "./HomeHeader";
import styles from "../styles/home.module.css";

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

const SUPPORT_CATEGORIES = [
  {
    id: 'refunds',
    label: 'Refunds & Returns',
    faqs: [
      { q: "How do I request a refund for a missing item?", a: "Go to your orders history, select the order, and choose 'report missing items' to initiate a refund." },
      { q: "My order was canceled but I was charged.", a: "Refunds for canceled orders are processed automatically and take 3-5 business days to appear on your bank statement." }
    ]
  },
  {
    id: 'delivery',
    label: 'Delivery Issues',
    faqs: [
      { q: "My delivery partner hasn't arrived.", a: "You can track the partner in real-time on the order map. If they are static, you can message them directly." }
    ]
  },
  {
    id: 'other',
    label: 'Other Help Topic',
    faqs: [
      { q: "Contact merchants", a: "Please contact merchants directly via phone or email for order customization requests." }
    ]
  }
];

export default function CustomerHomePage() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [location, setLocation] = useState("Madhapur, Hyderabad");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("home");
  
  // Cart item count (mocked)
  const cartItemCount = 3;

  // Support system states
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [supportChatDoc, setSupportChatDoc] = useState<any>(null);
  const [supportStep, setSupportStep] = useState<'category' | 'faq' | 'details' | 'queue' | 'chat'>('category');
  const [selectedSupportCategory, setSelectedSupportCategory] = useState<any>(null);
  const [supportDetailsText, setSupportDetailsText] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("Customer Partner");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authenticate/Assign customerId
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCustomerId(user.uid);
        setCustomerName(user.phoneNumber || "Customer " + user.uid.slice(0, 4));
      } else {
        let guestId = localStorage.getItem("customer_guest_uid");
        if (!guestId) {
          guestId = "cust_" + Math.random().toString(36).substring(2, 9);
          localStorage.setItem("customer_guest_uid", guestId);
        }
        setCustomerId(guestId);
        setCustomerName("Guest Customer");
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to support chat messages & doc
  useEffect(() => {
    if (!customerId) {
      setSupportMessages([]);
      setSupportChatDoc(null);
      return;
    }
    const q = query(
      collection(db, 'customerSupportChats', customerId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSupportMessages(msgs);

      if (activeTab === 'support') {
        msgs.forEach(async (m: any) => {
          if (m.sender === 'admin' && !m.read) {
            try {
              const msgRef = doc(db, 'customerSupportChats', customerId, 'messages', m.id);
              await updateDoc(msgRef, { read: true });
            } catch (err) {
              console.error(err);
            }
          }
        });

        try {
          const chatRef = doc(db, 'customerSupportChats', customerId);
          updateDoc(chatRef, { unreadCountForDriver: 0 }); // unreadCountForDriver acts as unread count for user
        } catch (err) {}
      }
    });

    const unsubscribeDoc = onSnapshot(doc(db, 'customerSupportChats', customerId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSupportChatDoc(data);
        if (data.status === 'waiting') {
          setSupportStep('queue');
        } else if (data.status === 'connected' || data.status === 'closed') {
          setSupportStep('chat');
        }
      } else {
        setSupportChatDoc(null);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeDoc();
    };
  }, [customerId, activeTab]);

  // Typing indicator debounce
  useEffect(() => {
    if (!customerId || activeTab !== 'support' || !chatText.trim()) return;
    const chatRef = doc(db, 'customerSupportChats', customerId);
    updateDoc(chatRef, { typingCustomer: true }).catch(() => {});
    const delayDebounceFn = setTimeout(() => {
      updateDoc(chatRef, { typingCustomer: false }).catch(() => {});
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [chatText, customerId, activeTab]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  // Image resizer for attachments
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 400;
          if (width > height) {
            if (width > max) {
              height = Math.round((height * max) / width);
              width = max;
            }
          } else {
            if (height > max) {
              width = Math.round((width * max) / height);
              height = max;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Send support message
  const sendSupportMessage = async () => {
    if (!customerId) return;
    if (!chatText.trim() && !chatImage) return;

    const textToSend = chatText;
    const imageToSend = chatImage;

    setChatText('');
    setChatImage(null);

    try {
      const msgRef = doc(collection(db, 'customerSupportChats', customerId, 'messages'));
      await setDoc(msgRef, {
        sender: 'customer',
        text: textToSend,
        imageUrl: imageToSend || '',
        timestamp: serverTimestamp(),
        read: false
      });

      const chatRef = doc(db, 'customerSupportChats', customerId);
      await setDoc(chatRef, {
        lastMessageText: textToSend || "Sent an image",
        lastMessageTimestamp: serverTimestamp(),
        name: customerName,
        userName: customerName,
        unreadCountForAdmin: increment(1),
        unreadCountForDriver: 0,
        isOnline: true
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLocationClick = () => {
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
        {activeTab === "home" && (
          <>
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
          </>
        )}

        {/* ── Search Tab (Placeholder) ── */}
        {activeTab === "search" && (
          <div style={{ padding: "24px 20px", color: "#FFF" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "16px" }}>Search</h3>
            <p style={{ color: "#9CA3AF" }}>Search section is under construction.</p>
          </div>
        )}

        {/* ── Cart Tab (Placeholder) ── */}
        {activeTab === "cart" && (
          <div style={{ padding: "24px 20px", color: "#FFF" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "16px" }}>Your Cart</h3>
            <p style={{ color: "#9CA3AF" }}>Cart items will be shown here.</p>
          </div>
        )}

        {/* ── Orders Tab (Placeholder) ── */}
        {activeTab === "orders" && (
          <div style={{ padding: "24px 20px", color: "#FFF" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "16px" }}>Your Orders</h3>
            <p style={{ color: "#9CA3AF" }}>View past and active orders here.</p>
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div style={{ padding: "24px 20px", color: "#FFF" }}>
            <h3 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "24px" }}>Account Profile</h3>
            <div style={{ backgroundColor: "#1F2937", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
                  👤
                </div>
                <div>
                  <h4 style={{ fontWeight: "bold", fontSize: "1.2rem", margin: 0 }}>{customerName}</h4>
                  <span style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>Logged in with Mobile Auth</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button 
                onClick={() => setActiveTab("support")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "16px", 
                  borderRadius: "12px", 
                  backgroundColor: "#FF6B35", 
                  color: "#FFF", 
                  border: "none", 
                  fontWeight: "bold", 
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span>💬</span>
                  <span>Customer Support Chat</span>
                </div>
                <span>➔</span>
              </button>

              <button 
                onClick={() => {
                  auth.signOut();
                  alert("Logged out successfully");
                }}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  padding: "14px", 
                  borderRadius: "12px", 
                  backgroundColor: "#374151", 
                  color: "#EF4444", 
                  border: "none", 
                  fontWeight: "bold", 
                  cursor: "pointer" 
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* ── Support Tab (Uber-style Support View) ── */}
        {activeTab === "support" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#111827", color: "#FFF", minHeight: "calc(100vh - 160px)" }}>
            
            {/* Support Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #374151', backgroundColor: '#1F2937' }}>
              <button 
                onClick={() => {
                  if (supportStep === 'faq' || supportStep === 'details') {
                    setSupportStep('category');
                  } else {
                    setActiveTab('profile');
                  }
                }} 
                style={{ background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={22} />
              </button>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Customer Support</h3>
            </div>

            {/* Step 1: Category Selection */}
            {supportStep === 'category' && (
              <div style={{ padding: '24px 16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#F3F4F6' }}>Select an issue category:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedSupportCategory(cat);
                        setSupportStep('faq');
                        setExpandedFaqIndex(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        color: '#FFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 'bold'
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{ color: '#FF6B35' }}>➔</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: FAQs */}
            {supportStep === 'faq' && selectedSupportCategory && (
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 'bold' }}>Category</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '4px 0 16px 0', color: '#FFF' }}>{selectedSupportCategory.label}</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 'bold' }}>Frequently Asked Questions:</span>
                  {selectedSupportCategory.faqs.map((faq: any, idx: number) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div key={idx} style={{ backgroundColor: '#1F2937', borderRadius: '10px', border: '1px solid #374151', overflow: 'hidden' }}>
                        <button
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#FFF',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{faq.q}</span>
                          <span style={{ color: '#FF6B35' }}>{isExpanded ? '▲' : '▼'}</span>
                        </button>
                        {isExpanded && (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid #374151', fontSize: '0.85rem', color: '#D1D5DB', lineHeight: '1.5' }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSupportStep('details')}
                  style={{
                    marginTop: '20px',
                    padding: '14px',
                    backgroundColor: '#FF6B35',
                    color: '#FFF',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Still need help? Write issue details
                </button>
              </div>
            )}

            {/* Step 3: Issue Details input */}
            {supportStep === 'details' && selectedSupportCategory && (
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFF', margin: 0 }}>Provide details about your issue:</h4>
                
                <textarea
                  placeholder="Tell us what happened in detail..."
                  value={supportDetailsText}
                  onChange={(e) => setSupportDetailsText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '8px',
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    color: '#FFF',
                    padding: '12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />

                {/* File Upload / Attachment */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#1F2937', borderRadius: '8px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Image Attachment (Optional)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ cursor: 'pointer', color: '#FF6B35', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <Paperclip size={16} />
                      Choose
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const resized = await resizeImage(file);
                              setChatImage(resized);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>
                    {chatImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src={chatImage} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                        <button onClick={() => setChatImage(null)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '1rem', cursor: 'pointer' }}>&times;</button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!supportDetailsText.trim()) {
                      alert("Please provide some issue details first.");
                      return;
                    }
                    try {
                      const chatRef = doc(db, 'customerSupportChats', customerId!);
                      await setDoc(chatRef, {
                        status: 'waiting',
                        assignedAdminName: null,
                        category: selectedSupportCategory.label,
                        issueDetails: supportDetailsText,
                        name: customerName,
                        userName: customerName,
                        unreadCountForAdmin: 1,
                        unreadCountForDriver: 0,
                        lastMessageText: "Ticket opened: " + supportDetailsText,
                        lastMessageTimestamp: serverTimestamp(),
                        isOnline: true
                      }, { merge: true });

                      const msgRef = doc(collection(db, 'customerSupportChats', customerId!, 'messages'));
                      await setDoc(msgRef, {
                        sender: 'customer',
                        text: "Issue Category: " + selectedSupportCategory.label + "\n\nDetails: " + supportDetailsText,
                        imageUrl: chatImage || '',
                        timestamp: serverTimestamp(),
                        read: false
                      });

                      setSupportDetailsText('');
                      setChatImage(null);
                      setSupportStep('queue');
                    } catch (err: any) {
                      alert("Failed to submit: " + err.message);
                    }
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '14px',
                    backgroundColor: '#FF6B35',
                    color: '#FFF',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Ticket & Connect
                </button>
              </div>
            )}

            {/* Step 4: Waiting Queue */}
            {supportStep === 'queue' && (
              <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3.5rem', marginBottom: '20px' }}>⌛</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Connecting to support agent</h4>
                <p style={{ fontSize: '0.95rem', color: '#D1D5DB', lineHeight: '1.6', marginBottom: '32px', maxWidth: '300px' }}>
                  Thanks for providing this information.<br />
                  We'll connect you to the next available support representative.
                </p>

                {supportChatDoc && (
                  <div style={{ backgroundColor: '#1F2937', padding: '16px', borderRadius: '12px', border: '1px solid #374151', width: '100%', maxWidth: '320px', textAlign: 'left', marginBottom: '40px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' }}>Submitted Details</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF6B35', margin: '4px 0' }}>Category: {supportChatDoc.category}</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#E5E7EB', maxHeight: '100px', overflowY: 'auto' }}>{supportChatDoc.issueDetails}</p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (confirm("Cancel support ticket request?")) {
                      try {
                        await setDoc(doc(db, 'customerSupportChats', customerId!), { status: 'closed' }, { merge: true });
                        setSupportStep('category');
                      } catch (err) {}
                    }
                  }}
                  style={{ padding: '10px 20px', color: '#EF4444', backgroundColor: 'transparent', border: '1px solid #EF4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel Support Request
                </button>
              </div>
            )}

            {/* Step 5: Chat Window */}
            {supportStep === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                
                {/* Banner Status Banner */}
                {supportChatDoc?.status === 'closed' ? (
                  <div style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                    This conversation has been closed by support.
                  </div>
                ) : supportChatDoc?.assignedAdminName ? (
                  <div style={{ backgroundColor: '#10B981', color: '#FFF', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>Connected to {supportChatDoc.assignedAdminName}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({supportChatDoc.adminOnline ? 'Online' : 'Offline'})</span>
                    {supportChatDoc.typingAdmin && <span style={{ fontSize: '0.75rem', fontStyle: 'italic', fontWeight: 'normal' }}>(typing...)</span>}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#374151', color: '#FFF', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                    Waiting for support representative...
                  </div>
                )}

                {/* Messages Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', height: '350px' }}>
                  {supportMessages.length === 0 ? (
                    <div style={{ alignSelf: 'center', color: '#9CA3AF', fontSize: '0.85rem', marginTop: '40px' }}>Say hello to support representative!</div>
                  ) : (
                    supportMessages.map((m, index) => {
                      const isMe = m.sender === 'customer';
                      const timeStr = m.timestamp ? (m.timestamp.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '';
                      return (
                        <div
                          key={m.id || index}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            backgroundColor: isMe ? '#FF6B35' : '#1F2937',
                            color: '#FFF',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="attachment" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px', marginBottom: '4px' }} />
                          )}
                          {m.text && <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.text}</span>}
                          <span style={{ fontSize: '0.7rem', color: isMe ? '#F3F4F6' : '#9CA3AF', alignSelf: 'flex-end' }}>{timeStr}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Footer Input or Start New Button */}
                {supportChatDoc?.status === 'closed' ? (
                  <div style={{ padding: '16px', borderTop: '1px solid #374151', backgroundColor: '#1F2937', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, 'customerSupportChats', customerId!), { status: 'open', assignedAdminName: null }, { merge: true });
                          // Also remove all messages to reset the history for the new ticket
                          setSupportStep('category');
                        } catch (err) {}
                      }}
                      style={{ padding: '12px 24px', backgroundColor: '#FF6B35', border: 'none', borderRadius: '8px', color: '#FFF', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Open a New Support Ticket
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderTop: '1px solid #374151', backgroundColor: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Attachment Option */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#374151', cursor: 'pointer' }}>
                      <Paperclip size={18} style={{ color: '#9CA3AF' }} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const imgBase64 = await resizeImage(file);
                              setChatImage(imgBase64);
                            } catch (err) {}
                          }
                        }}
                      />
                    </label>

                    {/* Chat Text Input */}
                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      {chatImage && (
                        <div style={{ position: 'absolute', bottom: '46px', left: 0, backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid #4B5563', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={chatImage} alt="preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                          <button onClick={() => setChatImage(null)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '1rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendSupportMessage();
                          }
                        }}
                        style={{ width: '100%', borderRadius: '20px', border: '1px solid #4B5563', backgroundColor: '#374151', color: '#FFF', padding: '8px 16px', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <button
                      onClick={sendSupportMessage}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FF6B35', border: 'none', cursor: 'pointer' }}
                    >
                      <Send size={16} style={{ color: '#FFF' }} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Navigation ────────────────────────────────────────────────── */}
      <nav className={styles.bottomNav} aria-label="Main Navigation">
        <button 
          onClick={() => setActiveTab("home")} 
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
          onClick={() => setActiveTab("cart")} 
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
          onClick={() => setActiveTab("orders")} 
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
          onClick={() => setActiveTab("profile")} 
          className={`${styles.navItem} ${activeTab === "profile" || activeTab === "support" ? styles.navItemActive : ""}`}
          aria-current={activeTab === "profile" || activeTab === "support" ? "page" : undefined}
        >
          <div className={styles.navIconWrap}>
            {(activeTab === "profile" || activeTab === "support") && <span className={styles.navActiveIndicator} />}
            <User size={22} />
          </div>
          <span className={styles.navLabel}>Profile</span>
        </button>
      </nav>
    </main>
  );
}

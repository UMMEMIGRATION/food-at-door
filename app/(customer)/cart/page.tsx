"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Receipt, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import styles from "./cart.module.css";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, addItem } = useCartStore();

  // ── Pre-fill Cart on initial mount if empty (for demonstration) ──────────────
  useEffect(() => {
    const prefillCart = async () => {
      const isCleared = localStorage.getItem("fad_cart_cleared") === "true";
      const savedItemsStr = localStorage.getItem("fad_cart_items");
      const savedItems = savedItemsStr ? JSON.parse(savedItemsStr) : [];

      if (isCleared || savedItems.length > 0 || items.length > 0) {
        return;
      }
      if (items.length === 0) {
        let realRestaurantId = "r1";
        let realRestaurantName = "Paradise Biryani";
        try {
          const q = query(
            collection(db, "restaurants"),
            where("status", "==", "approved"),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            realRestaurantId = snap.docs[0].id;
            realRestaurantName = snap.docs[0].data().name || "Paradise Biryani";
          }
        } catch (e) {
          console.error("Error fetching real restaurant for cart prefill:", e);
        }

        const demoItems = [
          {
            id: realRestaurantId + "_m1",
            name: "Special Chicken Biryani",
            price: 380,
            emoji: "🍛",
            description: "Fragrant basmati rice layered with succulent chicken, saffron, and traditional spices.",
            restaurantId: realRestaurantId,
            restaurantName: realRestaurantName,
          },
          {
            id: realRestaurantId + "_m2",
            name: "Niloufer Special Tea",
            price: 50,
            emoji: "☕",
            description: "Rich, creamy, and aromatic Hyderabadi Irani Chai.",
            restaurantId: realRestaurantId,
            restaurantName: realRestaurantName,
          }
        ];
        
        // Load them into Zustand store
        demoItems.forEach(item => addItem(item));
        // Give the first item an extra quantity to look more realistic
        updateQuantity(realRestaurantId + "_m1", 2);
      }
    };
    prefillCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bill Calculations ──────────────────────────────────────────────────────
  const { subtotal, deliveryFee, taxAndCharges, grandTotal } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Free delivery if order value > ₹500
    const delivery = sub > 0 && sub < 500 ? 40 : 0;
    
    // 5% GST + ₹15 fixed platform & restaurant handling fees
    const taxes = sub > 0 ? Math.round(sub * 0.05 + 15) : 0;
    
    const total = sub + delivery + taxes;

    return {
      subtotal: sub,
      deliveryFee: delivery,
      taxAndCharges: taxes,
      grandTotal: total
    };
  }, [items]);

  // ── Checkout handler ───────────────────────────────────────────────────────
  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <main className={styles.page}>
      {/* ── Sticky Top Header ────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => router.back()} 
            className={styles.backBtn}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>My Cart</h1>
        </div>
        {items.length > 0 && (
          <button 
            onClick={clearCart} 
            className={styles.clearAllBtn}
            aria-label="Clear all items from shopping cart"
          >
            Clear Cart
          </button>
        )}
      </header>

      {/* ── Scrollable Cart Details ─────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        {items.length === 0 ? (
          /* Empty state view */
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h2 className={styles.emptyHeading}>Your cart is empty</h2>
            <p className={styles.emptyText}>
              Add items from your favourite restaurants to start a new order.
            </p>
            <button 
              onClick={() => router.push("/restaurant")}
              className={styles.shopBtn}
            >
              <ShoppingBag size={16} />
              <span>Browse Restaurants</span>
            </button>
          </section>
        ) : (
          /* Cart active items listing */
          <>
            <section className={styles.cartList} aria-label="Shopping cart items">
              {items.map((item) => (
                <div key={item.id} className={styles.cartCard}>
                  {/* Food item image wrap */}
                  <div className={styles.imageWrap}>
                    {item.emoji && (item.emoji.startsWith("http") || item.emoji.startsWith("data:image")) ? (
                      <img 
                        src={item.emoji} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className={styles.emoji} role="img" aria-label={item.name}>
                        {item.emoji || "🍔"}
                      </span>
                    )}
                  </div>

                  {/* Food item name & restaurant info */}
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                    <span className={styles.itemRestaurant}>from {item.restaurantName}</span>
                  </div>

                  {/* Right side controls */}
                  <div className={styles.actionsBlock}>
                    <div className={styles.qtyControl}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Bill summary card ─────────────────────────────────────────── */}
            <section className={styles.billContainer} aria-labelledby="bill-title">
              <h2 id="bill-title" className={styles.billTitle}>
                <Receipt size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "middle" }} />
                Bill Summary
              </h2>
              
              <div className={styles.paymentRow}>
                <span>Item Subtotal</span>
                <span className={styles.paymentValue}>₹{subtotal}</span>
              </div>
              
              <div className={styles.paymentRow}>
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className={styles.freeValue}>FREE</span>
                ) : (
                  <span className={styles.paymentValue}>₹{deliveryFee}</span>
                )}
              </div>

              <div className={styles.paymentRow}>
                <span>Taxes & Restaurant Charges</span>
                <span className={styles.paymentValue}>₹{taxAndCharges}</span>
              </div>

              {subtotal < 500 && (
                <div style={{ fontSize: "11px", color: "#FF8C55", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <Sparkles size={11} />
                  <span>Add ₹{500 - subtotal} more for Free Delivery!</span>
                </div>
              )}

              <div className={styles.divider} />

              <div className={styles.grandTotalRow}>
                <span>To Pay</span>
                <span className={styles.grandTotalValue}>₹{grandTotal}</span>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── Sticky Bottom Checkout Bar ───────────────────────────────────────── */}
      {items.length > 0 && (
        <section className={styles.checkoutBtnContainer} aria-label="Checkout action">
          <button 
            onClick={handleCheckout} 
            className={styles.checkoutBtn}
          >
            <div className={styles.checkoutInfo}>
              <span className={styles.checkoutLabel}>Total to Pay</span>
              <span className={styles.checkoutPrice}>₹{grandTotal}</span>
            </div>
            
            <div className={styles.checkoutAction}>
              <span>Proceed to Checkout</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </button>
        </section>
      )}
    </main>
  );
}

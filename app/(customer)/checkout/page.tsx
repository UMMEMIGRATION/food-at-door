"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Plus, 
  Check, 
  ChevronRight, 
  Wallet, 
  Banknote,
  Receipt,
  Smartphone
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import styles from "./checkout.module.css";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  tag: string;
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  // ── Address State ──────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "a1",
      tag: "Home 🏠",
      text: "Flat 304, Srinivasa Heights, Madhapur, Hyderabad - 500081",
    },
    {
      id: "a2",
      tag: "Office 🏢",
      text: "Building 12, Mindspace IT Park, Gachibowli, Hyderabad - 500032",
    }
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState("a1");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressTag, setNewAddressTag] = useState("");
  const [newAddressText, setNewAddressText] = useState("");

  // ── Payment State ──────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState<"ONLINE" | "COD">("ONLINE");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // ── Cart Calculations (with mock fallback if empty) ────────────────────────
  const { subtotal, deliveryFee, taxAndCharges, grandTotal } = useMemo(() => {
    const hasItems = items.length > 0;
    const sub = hasItems 
      ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : 380; // Fallback mock subtotal
    
    const delivery = sub > 0 && sub < 500 ? 40 : 0;
    const taxes = sub > 0 ? Math.round(sub * 0.05 + 15) : 0;
    const total = sub + delivery + taxes;

    return {
      subtotal: sub,
      deliveryFee: delivery,
      taxAndCharges: taxes,
      grandTotal: total
    };
  }, [items]);

  // ── Address Handlers ───────────────────────────────────────────────────────
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressTag.trim() || !newAddressText.trim()) return;

    const newAddr: Address = {
      id: `a_${Date.now()}`,
      tag: newAddressTag,
      text: newAddressText,
    };

    setAddresses((prev) => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setNewAddressTag("");
    setNewAddressText("");
    setIsAddingAddress(false);
  };

  // ── Place Order Handler ────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    // Basic Form validation (only for ONLINE payments)
    if (paymentType === "ONLINE") {
      if (paymentMethod === "upi" && !upiId.trim()) {
        alert("Please enter your UPI ID.");
        return;
      }
      if (paymentMethod === "card" && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
        alert("Please fill in your credit/debit card details.");
        return;
      }
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Error: You must be logged in to place an order.");
      return;
    }

    const defaultRestaurantId = items[0]?.restaurantId;
    const defaultRestaurantName = items[0]?.restaurantName || "Paradise Biryani";

    if (!defaultRestaurantId) {
      alert("Error: No valid restaurant selected for this order.");
      return;
    }

    let restaurantName = defaultRestaurantName;
    let restaurantAddress = "Hyderabad";
    let restaurantCity = "Hyderabad";
    let restaurantState = "Telangana";
    let restaurantLat = 17.4485;
    let restaurantLng = 78.3740;

    try {
      const restRef = doc(db, "restaurants", defaultRestaurantId);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        const restData = restSnap.data();
        if (restData.name) restaurantName = restData.name;
        
        // Extract address string
        if (restData.address) {
          if (typeof restData.address === "string") {
            restaurantAddress = restData.address;
          } else if (restData.address.line1) {
            restaurantAddress = restData.address.line1;
          }
          
          if (restData.address.city) restaurantCity = restData.address.city;
          if (restData.address.state) restaurantState = restData.address.state;
          if (restData.address.lat !== undefined) restaurantLat = Number(restData.address.lat);
          if (restData.address.lng !== undefined) restaurantLng = Number(restData.address.lng);
        }
        
        if (restData.city) restaurantCity = restData.city;
        if (restData.state) restaurantState = restData.state;
        if (restData.latitude !== undefined) restaurantLat = Number(restData.latitude);
        if (restData.longitude !== undefined) restaurantLng = Number(restData.longitude);
        if (restData.lat !== undefined) restaurantLat = Number(restData.lat);
        if (restData.lng !== undefined) restaurantLng = Number(restData.lng);
      }
    } catch (e) {
      console.warn("[Checkout] Failed to fetch restaurant coordinates/location details, using default fallbacks:", e);
    }

    // Get actual customer name and phone from users collection
    let customerName = currentUser.displayName || "Customer";
    let customerPhone = currentUser.phoneNumber || "";
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.name) customerName = userData.name;
        if (userData.phone) customerPhone = userData.phone;
      }
    } catch (err) {
      console.warn("Failed to get customer profile:", err);
    }

    // Extract restaurant localization/address details
    let restaurantCountry = "India";
    let restaurantArea = "";
    
    try {
      const restRef = doc(db, "restaurants", defaultRestaurantId);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        const restData = restSnap.data();
        if (restData.address) {
          if (typeof restData.address === "object") {
            if (restData.address.country) restaurantCountry = restData.address.country;
            if (restData.address.area) restaurantArea = restData.address.area;
            if (restData.address.line1) restaurantAddress = restData.address.line1;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve extra restaurant address details:", e);
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      alert("❌ Configuration Error: Google Maps API key is missing. Please contact system administrator.");
      return;
    }

    // Convert customer address text to coordinates using Google Maps Geocoder API
    let customerLatitude = restaurantLat;
    let customerLongitude = restaurantLng;
    const addressToGeocode = selectedAddress?.text || "";

    if (addressToGeocode) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}`
        );
        const resData = await response.json();
        if (resData.status === "OK" && resData.results?.[0]?.geometry?.location) {
          const loc = resData.results[0].geometry.location;
          customerLatitude = Number(loc.lat);
          customerLongitude = Number(loc.lng);
          console.log("[Checkout Geocode Success] Lat:", customerLatitude, "Lng:", customerLongitude);
        } else {
          console.warn("[Checkout Geocode Fail] Status:", resData.status, "using restaurant coordinates fallback");
        }
      } catch (err) {
        console.error("[Checkout Geocode Error] Failed geocoding customer address:", err);
      }
    }

    const orderData = {
      customerId: currentUser.uid,
      customerName,
      customerPhone,
      customerAddress: selectedAddress?.text || "",
      customerLatitude,
      customerLongitude,
      customerEmail: currentUser.email || "customer@example.com",
      restaurantId: defaultRestaurantId,
      restaurantName,
      restaurantAddress,
      restaurantCity,
      restaurantState,
      restaurantCountry,
      restaurantArea,
      restaurantLat,
      restaurantLng,
      restaurantLatitude: restaurantLat,
      restaurantLongitude: restaurantLng,
      items: items.map(item => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.emoji || "🍔"
      })),
      subtotal,
      deliveryFee,
      tax: taxAndCharges,
      platformFee: taxAndCharges, // Compatibility mapping
      grandTotal,
      total: grandTotal,          // Compatibility mapping
      paymentMethod: paymentType === "COD" ? "COD" : "ONLINE",
      paymentStatus: paymentType === "COD" ? "Pending" : "Paid",
      status: "pending",
      createdAt: serverTimestamp(),
      address: {
        id: selectedAddress?.id || "a1",
        tag: selectedAddress?.tag || "Home",
        text: selectedAddress?.text || ""
      },
      deliveryAddress: {          // Compatibility mapping
        line1: selectedAddress?.text || ""
      }
    };

    try {
      console.log("[Auth Diagnostics] Attempting to write order doc to Firestore:", orderData);
      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, orderData);
      console.log("[Auth Diagnostics] Order written successfully, ID:", docRef.id);

      alert(
        `🎉 Order Placed Successfully!\n\n` +
        `Order ID: ${docRef.id}\n` +
        `Deliver To: ${selectedAddress?.tag}\n` +
        `Payment Method: ${paymentType === "COD" ? "CASH ON DELIVERY (COD)" : `ONLINE PAYMENT (${paymentMethod.toUpperCase()})`}\n` +
        `Grand Total: ₹${grandTotal}\n\n` +
        `Thank you for ordering with Food At Door!`
      );

      clearCart();
      router.push("/");
    } catch (err: any) {
      console.error("[Auth Diagnostics] Firestore order write error:", err);
      alert("❌ Failed to place order. Firestore write error: " + (err.message || err));
    }
  };

  return (
    <main className={styles.page}>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <button 
          onClick={() => router.back()} 
          className={styles.backBtn}
          aria-label="Go back to cart page"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Checkout</h1>
      </header>

      {/* ── Scrollable Sections ──────────────────────────────────────────────── */}
      <div className={styles.scrollBody}>
        
        {/* ── Address Section ────────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="address-heading">
          <h2 id="address-heading" className={styles.sectionTitle}>
            <MapPin size={15} style={{ color: "#FF6B35" }} />
            Delivery Address
          </h2>

          <div className={styles.addressList}>
            {addresses.map((address) => (
              <div 
                key={address.id} 
                onClick={() => setSelectedAddressId(address.id)}
                className={`${styles.addressCard} ${selectedAddressId === address.id ? styles.addressCardActive : ""}`}
                role="radio"
                aria-checked={selectedAddressId === address.id}
                tabIndex={0}
              >
                <input 
                  type="radio" 
                  name="deliveryAddress" 
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className={styles.radioInput}
                  aria-label={`Select address: ${address.tag}`}
                />
                <div className={styles.addressDetails}>
                  <h3 className={styles.addressTag}>{address.tag}</h3>
                  <p className={styles.addressText}>{address.text}</p>
                </div>
                {selectedAddressId === address.id && (
                  <Check size={14} style={{ color: "#FF6B35", position: "absolute", top: "14px", right: "14px" }} />
                )}
              </div>
            ))}
          </div>

          {/* Inline Add Address Trigger / Form */}
          {!isAddingAddress ? (
            <button 
              onClick={() => setIsAddingAddress(true)}
              className={styles.addAddressBtn}
              aria-label="Add a new delivery address"
            >
              <Plus size={14} />
              <span>Add New Address</span>
            </button>
          ) : (
            <form onSubmit={handleAddAddress} className={styles.addAddressForm}>
              <input
                type="text"
                placeholder="Address Tag (e.g. Gym 🏋️, Friend's house)"
                value={newAddressTag}
                onChange={(e) => setNewAddressTag(e.target.value)}
                className={styles.inputField}
                required
              />
              <textarea
                placeholder="Full Address details (Flat/House No, Building, Street, Area, Pincode)"
                value={newAddressText}
                onChange={(e) => setNewAddressText(e.target.value)}
                className={styles.inputField}
                style={{ height: "60px", resize: "none" }}
                required
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnSubmit}>Save & Select</button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingAddress(false)} 
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Payment Section ────────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="payment-heading">
          <h2 id="payment-heading" className={styles.sectionTitle}>
            <Wallet size={15} style={{ color: "#FF6B35" }} />
            Payment Method
          </h2>

          <div className={styles.paymentList} role="radiogroup">
            {/* Online Payment Option */}
            <div className={`${styles.paymentOption} ${paymentType === "ONLINE" ? styles.paymentOptionActive : ""}`}>
              <div className={styles.paymentHeader} onClick={() => setPaymentType("ONLINE")}>
                <input 
                  type="radio" 
                  name="paymentType" 
                  checked={paymentType === "ONLINE"}
                  onChange={() => setPaymentType("ONLINE")}
                  className={styles.radioInput}
                  aria-label="Select Online payment"
                />
                <CreditCard size={16} style={{ color: "#FF6B35" }} />
                <span className={styles.paymentTitle}>Online Payment</span>
              </div>
              {paymentType === "ONLINE" && (
                <div className={styles.paymentDetails} style={{ paddingLeft: "24px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* UPI Payment */}
                  <div className={`${styles.paymentOption} ${paymentMethod === "upi" ? styles.paymentOptionActive : ""}`}>
                    <div className={styles.paymentHeader} onClick={() => setPaymentMethod("upi")}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                        className={styles.radioInput}
                        aria-label="Select UPI payment"
                      />
                      <Smartphone size={16} style={{ color: "#3B82F6" }} />
                      <span className={styles.paymentTitle}>UPI (Paytm, GPay, PhonePe)</span>
                    </div>
                    {paymentMethod === "upi" && (
                      <div className={styles.paymentDetails}>
                        <input
                          type="text"
                          placeholder="Enter UPI ID (e.g. user@okhdfcbank)"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Credit/Debit Card */}
                  <div className={`${styles.paymentOption} ${paymentMethod === "card" ? styles.paymentOptionActive : ""}`}>
                    <div className={styles.paymentHeader} onClick={() => setPaymentMethod("card")}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className={styles.radioInput}
                        aria-label="Select Card payment"
                      />
                      <CreditCard size={16} style={{ color: "#8B5CF6" }} />
                      <span className={styles.paymentTitle}>Credit / Debit Card</span>
                    </div>
                    {paymentMethod === "card" && (
                      <div className={styles.paymentDetails}>
                        <input
                          type="text"
                          placeholder="Card Number (16 digits)"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                          className={styles.inputField}
                          required
                        />
                        <div className={styles.cardRow}>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                            className={styles.inputField}
                            style={{ flex: 1 }}
                            required
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                            className={styles.inputField}
                            style={{ flex: 1 }}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cash on Delivery Option */}
            <div className={`${styles.paymentOption} ${paymentType === "COD" ? styles.paymentOptionActive : ""}`}>
              <div className={styles.paymentHeader} onClick={() => setPaymentType("COD")}>
                <input 
                  type="radio" 
                  name="paymentType" 
                  checked={paymentType === "COD"}
                  onChange={() => setPaymentType("COD")}
                  className={styles.radioInput}
                  aria-label="Select Cash on Delivery"
                />
                <Banknote size={16} style={{ color: "#10B981" }} />
                <span className={styles.paymentTitle}>Cash on Delivery (COD)</span>
              </div>
              {paymentType === "COD" && (
                <div className={styles.paymentDetails} style={{ paddingLeft: "24px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: "1.4" }}>
                    💵 Please pay <strong>₹{grandTotal}</strong> to the delivery agent via Cash or UPI code when your food is delivered.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Order Summary Card ─────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="bill-heading">
          <h2 id="bill-heading" className={styles.sectionTitle}>
            <Receipt size={14} style={{ color: "#FF6B35" }} />
            Order Summary
          </h2>

          <div className={styles.paymentRow}>
            <span>Items Subtotal</span>
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

          <div className={styles.divider} />

          <div className={styles.grandTotalRow}>
            <span>Total amount to pay</span>
            <span className={styles.grandTotalValue}>₹{grandTotal}</span>
          </div>
        </section>
      </div>

      {/* ── Sticky Bottom Place Order Bar ────────────────────────────────────── */}
      <section className={styles.checkoutBtnContainer} aria-label="Confirm Order">
        <button 
          onClick={handlePlaceOrder} 
          className={styles.checkoutBtn}
        >
          <div className={styles.checkoutInfo}>
            <span className={styles.checkoutLabel}>Grand Total</span>
            <span className={styles.checkoutPrice}>₹{grandTotal}</span>
          </div>
          
          <div className={styles.checkoutAction}>
            <span>Place Order</span>
            <ChevronRight size={18} strokeWidth={2.5} />
          </div>
        </button>
      </section>
    </main>
  );
}

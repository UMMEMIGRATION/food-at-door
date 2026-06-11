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
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "card">("cod");
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
  const handlePlaceOrder = () => {
    // Basic Form validation
    if (paymentMethod === "upi" && !upiId.trim()) {
      alert("Please enter your UPI ID.");
      return;
    }
    if (paymentMethod === "card" && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      alert("Please fill in your credit/debit card details.");
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    
    alert(
      `🎉 Order Placed Successfully!\n\n` +
      `Deliver To: ${selectedAddress?.tag}\n` +
      `Payment Method: ${paymentMethod.toUpperCase()}\n` +
      `Grand Total: ₹${grandTotal}\n\n` +
      `Thank you for ordering with Food At Door!`
    );

    clearCart();
    router.push("/");
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
            {/* Cash on Delivery */}
            <div className={`${styles.paymentOption} ${paymentMethod === "cod" ? styles.paymentOptionActive : ""}`}>
              <div className={styles.paymentHeader} onClick={() => setPaymentMethod("cod")}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className={styles.radioInput}
                  aria-label="Select Cash On Delivery payment"
                />
                <Banknote size={16} style={{ color: "#10B981" }} />
                <span className={styles.paymentTitle}>Cash On Delivery (COD)</span>
              </div>
            </div>

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

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, CreditCard, Banknote, ShieldCheck, Compass, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./payments.module.css";

interface SavedCard {
  id: string;
  number: string;
  holder: string;
  expiry: string;
}

export default function PaymentsPage() {
  const router = useRouter();

  // Payment Selection State
  const [selectedMethod, setSelectedMethod] = useState<string>("cod");

  // Credit Cards State
  const [cards, setCards] = useState<SavedCard[]>([
    {
      id: "card-1",
      number: "•••• •••• •••• 4218",
      holder: "ARAVIND CHOWDARY",
      expiry: "08/30"
    }
  ]);

  // Form input fields for a new card
  const [newNumber, setNewNumber] = useState("");
  const [newHolder, setNewHolder] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCvv, setNewCvv] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || !newHolder || !newExpiry || !newCvv) {
      alert("Please fill in all card details.");
      return;
    }

    // Basic Card Number Masking for representation
    const cleanNum = newNumber.replace(/\s+/g, "");
    const masked = `•••• •••• •••• ${cleanNum.slice(-4)}`;

    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      number: masked,
      holder: newHolder.toUpperCase(),
      expiry: newExpiry
    };

    setCards([...cards, newCard]);
    setSelectedMethod(newCard.id);
    
    // Clear Form
    setNewNumber("");
    setNewHolder("");
    setNewExpiry("");
    setNewCvv("");
    setIsAddingCard(false);
    
    alert("💳 New Card Added and selected!");
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.back()} 
          className={styles.backBtn}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Payment Methods</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Visual Premium Card Overlay for demonstrating saved cards */}
        {cards.length > 0 && (
          <section className={styles.visualCard}>
            <div className={styles.cardChipRow}>
              <div className={styles.cardChip} />
              <span className={styles.cardBrand}>Antigravity Platinum</span>
            </div>
            <div className={styles.cardNumber}>
              {cards[cards.length - 1].number}
            </div>
            <div className={styles.cardBottom}>
              <div>
                <div className={styles.cardLabel}>Card Holder</div>
                <div className={styles.cardValue}>{cards[cards.length - 1].holder}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className={styles.cardLabel}>Expires</div>
                <div className={styles.cardValue}>{cards[cards.length - 1].expiry}</div>
              </div>
            </div>
          </section>
        )}

        {/* Methods Selection List */}
        <section>
          <h2 className={styles.sectionTitle}>Preferred Payment Options</h2>
          <div className={styles.methodList}>
            {/* Cash on Delivery */}
            <div 
              onClick={() => setSelectedMethod("cod")}
              className={`
                ${styles.methodCard} 
                ${selectedMethod === "cod" ? styles.methodCardSelected : ""}
              `}
            >
              <div className={styles.methodLeft}>
                <div className={styles.iconWrap}>
                  <Banknote size={20} color="#FF8C55" />
                </div>
                <div className={styles.methodInfo}>
                  <span className={styles.methodName}>Cash on Delivery (COD)</span>
                  <span className={styles.methodDesc}>Pay with cash/UPI at doorstep</span>
                </div>
              </div>
              <div className={`
                ${styles.selectDot}
                ${selectedMethod === "cod" ? styles.selectDotSelected : ""}
              `}>
                {selectedMethod === "cod" && <div className={styles.checkMark} />}
              </div>
            </div>

            {/* UPI */}
            <div 
              onClick={() => setSelectedMethod("upi")}
              className={`
                ${styles.methodCard} 
                ${selectedMethod === "upi" ? styles.methodCardSelected : ""}
              `}
            >
              <div className={styles.methodLeft}>
                <div className={styles.iconWrap}>
                  <Wallet size={20} color="#FF8C55" />
                </div>
                <div className={styles.methodInfo}>
                  <span className={styles.methodName}>Instant UPI (GPay/PhonePe)</span>
                  <span className={styles.methodDesc}>Pay instantly using any UPI app</span>
                </div>
              </div>
              <div className={`
                ${styles.selectDot}
                ${selectedMethod === "upi" ? styles.selectDotSelected : ""}
              `}>
                {selectedMethod === "upi" && <div className={styles.checkMark} />}
              </div>
            </div>

            {/* Saved Credit Cards */}
            {cards.map((card) => (
              <div 
                key={card.id}
                onClick={() => setSelectedMethod(card.id)}
                className={`
                  ${styles.methodCard} 
                  ${selectedMethod === card.id ? styles.methodCardSelected : ""}
                `}
              >
                <div className={styles.methodLeft}>
                  <div className={styles.iconWrap}>
                    <CreditCard size={20} color="#FF8C55" />
                  </div>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>{card.number}</span>
                    <span className={styles.methodDesc}>{card.holder}</span>
                  </div>
                </div>
                <div className={`
                  ${styles.selectDot}
                  ${selectedMethod === card.id ? styles.selectDotSelected : ""}
                `}>
                  {selectedMethod === card.id && <div className={styles.checkMark} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add Card form toggler */}
        {!isAddingCard ? (
          <button onClick={() => setIsAddingCard(true)} className={styles.submitBtn}>
            Add New Credit / Debit Card
          </button>
        ) : (
          <form onSubmit={handleAddCard} className={styles.formSection}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: "8px" }}>Add New Card</h3>
            <input
              type="text"
              placeholder="Card Number (16 Digits)"
              maxLength={19}
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className={styles.inputField}
            />
            <input
              type="text"
              placeholder="Card Holder Name"
              value={newHolder}
              onChange={(e) => setNewHolder(e.target.value)}
              className={styles.inputField}
            />
            <div className={styles.rowInputs}>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="password"
                placeholder="CVV"
                maxLength={3}
                value={newCvv}
                onChange={(e) => setNewCvv(e.target.value)}
                className={styles.inputField}
              />
            </div>
            <div className={styles.rowInputs}>
              <button 
                type="button" 
                onClick={() => setIsAddingCard(false)} 
                className={styles.submitBtn} 
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", boxShadow: "none" }}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                Save Card
              </button>
            </div>
          </form>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "24px", color: "#6B7280", fontSize: "11px" }}>
          <ShieldCheck size={14} />
          <span>PCI-DSS Secured Transaction System</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav} aria-label="Main Navigation">
        <button onClick={() => router.push("/")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
            <Compass size={22} />
          </div>
          <span className={styles.navLabel}>Explore</span>
        </button>

        <button onClick={() => router.push("/#search")} className={styles.navItem}>
          <div className={styles.navIconWrap}>
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

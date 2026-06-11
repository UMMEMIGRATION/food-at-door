"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Compass, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./wallet.module.css";

interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "in" | "out";
  emoji: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", name: "Loaded Money via UPI", date: "Today, 11:20 AM", amount: 500, type: "in", emoji: "💰" },
  { id: "tx-2", name: "Paid for Order #FAD-8409", date: "Today, 04:12 PM", amount: 866, type: "out", emoji: "🍛" },
  { id: "tx-3", name: "Cashback Received", date: "Yesterday, 06:15 PM", amount: 50, type: "in", emoji: "🎉" },
  { id: "tx-4", name: "Paid for Order #FAD-9218", date: "08 Jun 2026, 08:32 AM", amount: 420, type: "out", emoji: "☕" }
];

export default function WalletPage() {
  const router = useRouter();

  const [balance, setBalance] = useState(350); // Starting Mock Balance
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [amountInput, setAmountInput] = useState("");

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amountInput);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    // Update States
    setBalance(prev => prev + parsedAmt);
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      name: "Loaded Money to Wallet",
      date: "Just now",
      amount: parsedAmt,
      type: "in",
      emoji: "💳"
    };
    
    setTransactions([newTx, ...transactions]);
    setAmountInput("");
    setIsLoadingForm(false);
    alert(`✅ Success! ₹${parsedAmt} loaded to your Food At Door wallet.`);
  };

  const handleQuickSelect = (amt: number) => {
    setAmountInput(amt.toString());
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/profile")} 
          className={styles.backBtn}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>FAD Wallet</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Balance Card */}
        <section className={styles.balanceCard}>
          <div className={styles.balanceCardGlow} />
          <div>
            <span className={styles.balanceLabel}>Current Balance</span>
            <div className={styles.balanceVal}>₹{balance.toFixed(2)}</div>
          </div>
          {!isLoadingForm && (
            <button onClick={() => setIsLoadingForm(true)} className={styles.topupBtn}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Plus size={14} />
                <span>Add Money</span>
              </div>
            </button>
          )}
        </section>

        {/* Load Money Drawer form */}
        {isLoadingForm && (
          <form onSubmit={handleAddMoney} className={styles.loadFormSection}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: "8px" }}>Top Up Wallet</h3>
            <input
              type="number"
              placeholder="Enter amount (e.g. 500)"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className={styles.inputField}
              autoFocus
            />
            {/* Quick selectors */}
            <div style={{ display: "flex", gap: "8px", margin: "4px 0" }}>
              {[100, 500, 1000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleQuickSelect(quick)}
                  className={styles.loadCancelBtn}
                  style={{ padding: "8px" }}
                >
                  +₹{quick}
                </button>
              ))}
            </div>
            <div className={styles.loadActions}>
              <button 
                type="button" 
                onClick={() => setIsLoadingForm(false)} 
                className={styles.loadCancelBtn}
              >
                Cancel
              </button>
              <button type="submit" className={styles.loadSubmitBtn}>
                Load Wallet
              </button>
            </div>
          </form>
        )}

        {/* Transactions list */}
        <section>
          <h2 className={styles.sectionTitle}>Transaction History</h2>
          <div className={styles.list}>
            {transactions.map((tx) => (
              <div key={tx.id} className={styles.item}>
                <div className={styles.itemLeft}>
                  <div className={`
                    ${styles.itemIcon}
                    ${tx.type === "in" ? styles.iconIn : styles.iconOut}
                  `}>
                    {tx.type === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemName}>{tx.name}</span>
                    <span className={styles.itemDate}>{tx.date}</span>
                  </div>
                </div>
                <div className={`
                  ${styles.itemAmount}
                  ${tx.type === "in" ? styles.amtIn : styles.amtOut}
                `}>
                  {tx.type === "in" ? "+" : "-"} ₹{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </section>
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

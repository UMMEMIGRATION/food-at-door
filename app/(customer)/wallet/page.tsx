"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Compass, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import { auth, db, onAuthChange } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, updateDoc, setDoc } from "firebase/firestore";
import styles from "./wallet.module.css";

interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "in" | "out";
  emoji: string;
}

export default function WalletPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthChange((user) => {
      if (!user) {
        setUid(null);
        setBalance(0);
        setTransactions([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);

      // 1. Listen to user document for walletBalance in real-time
      const userRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setBalance(Number(userData.walletBalance) || 0);
        }
      });

      // 2. Listen to refundTransactions where customerId == user.uid
      const q = query(
        collection(db, "refundTransactions"),
        where("customerId", "==", user.uid)
      );
      
      const unsubscribeTxs = onSnapshot(q, (snap) => {
        const list: Transaction[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.description || "Refund Received",
            date: data.createdAt || "Just now",
            amount: Number(data.amount) || 0,
            type: "in",
            emoji: "💰"
          });
        });
        
        // Sort descending by id/timestamp
        list.sort((a, b) => b.id.localeCompare(a.id));
        setTransactions(list);
        setLoading(false);
      }, (err) => {
        console.error("Error loading refund transactions:", err);
        setLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeTxs();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amountInput);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    if (!uid) {
      alert("Please sign in to add money.");
      return;
    }

    setIsLoadingForm(true);
    try {
      const userRef = doc(db, "users", uid);
      const newBalance = balance + parsedAmt;
      await updateDoc(userRef, {
        walletBalance: newBalance
      });

      // Create transaction log in refundTransactions to track the top-up
      const txId = "tx_" + Date.now();
      await setDoc(doc(db, "refundTransactions", txId), {
        id: txId,
        customerId: uid,
        amount: parsedAmt,
        description: "Loaded Money via UPI",
        createdAt: new Date().toLocaleString(),
        status: "completed"
      });

      setAmountInput("");
      setIsLoadingForm(false);
      alert(`✅ Success! ₹${parsedAmt} loaded to your Food At Door wallet.`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to load money: " + err.message);
      setIsLoadingForm(false);
    }
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
          {loading ? (
            <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>Loading transaction history...</div>
          ) : transactions.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>No transactions recorded.</div>
          ) : (
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
          )}
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

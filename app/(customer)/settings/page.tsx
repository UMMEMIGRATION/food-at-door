"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun, Languages, LifeBuoy, Info, LogOut, Compass, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const router = useRouter();

  // Settings State variables
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("en");

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    alert(darkMode ? "☀️ Light mode simulated! Theme colors will transition." : "🌙 Dark mode reactivated!");
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    alert(`🗣️ Language switched to: ${lang === "en" ? "English" : lang === "te" ? "Telugu" : "Hindi"}`);
  };

  const handleLogout = () => {
    alert("👋 Logged out successfully!");
    router.push("/");
  };

  return (
    <main className={styles.page} style={{ background: darkMode ? "#0a0a0a" : "#1a1a1a" }}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.back()} 
          className={styles.backBtn}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Settings</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* Preference Settings */}
        <h2 className={styles.sectionLabel}>App Preferences</h2>
        <div className={styles.group}>
          {/* Dark Mode Row */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              {darkMode ? <Moon size={18} color="#FF8C55" /> : <Sun size={18} color="#FF8C55" />}
              <div>
                <span className={styles.title}>Dark Appearance</span>
                <p className={styles.desc}>Reduce glare and improve battery life</p>
              </div>
            </div>
            <div 
              onClick={handleToggleDarkMode}
              className={`
                ${styles.switch} 
                ${darkMode ? styles.switchActive : ""}
              `}
            >
              <div className={`
                ${styles.switchThumb} 
                ${darkMode ? styles.switchThumbActive : ""}
              `} />
            </div>
          </div>

          {/* Language Selector */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Languages size={18} color="#FF8C55" />
              <div>
                <span className={styles.title}>Display Language</span>
                <p className={styles.desc}>Select app interface language</p>
              </div>
            </div>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className={styles.selectField}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Support Settings */}
        <h2 className={styles.sectionLabel}>Support & Info</h2>
        <div className={styles.group}>
          {/* Help & Support */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <LifeBuoy size={18} color="#FF8C55" />
              <div>
                <span className={styles.title}>Help & Support Center</span>
                <p className={styles.desc}>FAQs, chat support and call options</p>
              </div>
            </div>
            <button 
              onClick={() => alert("💬 Initiating Chat Support for Customer Care...")}
              className={styles.helpLink}
            >
              Get Help
            </button>
          </div>

          {/* About */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Info size={18} color="#FF8C55" />
              <div>
                <span className={styles.title}>About Food At Door</span>
                <p className={styles.desc}>Version 0.1.0 • Terms of Service</p>
              </div>
            </div>
            <span style={{ fontSize: "11px", color: "#6B7280" }}>v0.1.0</span>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
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

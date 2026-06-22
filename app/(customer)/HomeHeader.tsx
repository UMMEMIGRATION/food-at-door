"use client";

import React from "react";
import { Search, MapPin, ChevronDown, Bell, Heart } from "lucide-react";
import styles from "./home.module.css";

interface HomeHeaderProps {
  location?: string;
  onLocationClick?: () => void;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onFavoritesClick?: () => void;
}

export default function HomeHeader({
  location = "Gachibowli, Hyderabad",
  onLocationClick,
  onSearchClick,
  onNotificationClick,
  onFavoritesClick,
}: HomeHeaderProps) {
  return (
    <header className={styles.header}>
      {/* Brand Logo & Name */}
      <div className={styles.logoContainer} style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "16px" }}>
        <span style={{ fontSize: "22px" }} role="img" aria-label="Food At Door Logo">🍽️</span>
        <span style={{ 
          fontWeight: "900", 
          fontSize: "16px", 
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #FF6B35, #FFAB40)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          fontFamily: "'Inter', sans-serif"
        }}>
          Food At Door
        </span>
      </div>

      {/* Location Picker */}
      <div className={styles.locationBlock} onClick={onLocationClick} role="button" tabIndex={0} aria-label={`Current delivery location: ${location}`}>
        <span className={styles.locationLabel}>
          <span className={styles.locationPulse} />
          Deliver To
        </span>
        <div className={styles.locationValue}>
          <MapPin size={14} style={{ color: "#FF6B35" }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{location}</span>
          <ChevronDown size={14} className={styles.locationChevron} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.headerActions}>
        <button className={styles.iconBtn} onClick={onSearchClick} aria-label="Search food or restaurants">
          <Search size={18} />
        </button>
        <button className={styles.iconBtn} onClick={onFavoritesClick} aria-label="View favorites">
          <Heart size={18} style={{ color: "#FF6B35" }} />
        </button>
        <button className={styles.iconBtn} onClick={onNotificationClick} aria-label="View notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>
      </div>
    </header>
  );
}

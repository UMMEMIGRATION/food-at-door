"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  History, 
  LogOut,
  Camera,
  Edit2,
  Compass, 
  Search, 
  ShoppingBag, 
  ClipboardList, 
  User as UserIcon
} from "lucide-react";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  
  // Profile state details (simulating client-side updates)
  const [profile, setProfile] = useState({
    name: "Aravind Chowdary",
    phone: "+91 98765 43210",
    email: "aravind.chowdary@gmail.com",
    avatar: "🧑‍💻"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);

  const handleSaveProfile = () => {
    setProfile({
      ...profile,
      name: editName,
      phone: editPhone,
      email: editEmail
    });
    setIsEditing(false);
    alert("✅ Profile updated successfully!");
  };

  const handleEditClick = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditEmail(profile.email);
    setIsEditing(true);
  };

  const handleLogout = () => {
    alert("👋 Logged out successfully!");
    router.push("/");
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/")} 
          className={styles.backBtn}
          aria-label="Back to home"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Profile Settings</h1>
      </header>

      <div className={styles.scrollBody}>
        {/* User Card Section */}
        <section className={styles.userSection}>
          <div className={styles.avatarWrapper}>
            <span>{profile.avatar}</span>
            <div className={styles.editAvatarBadge} onClick={() => alert("📸 Avatar photo upload modal!")}>
              <Camera size={14} />
            </div>
          </div>

          {!isEditing ? (
            <>
              <h2 className={styles.userName}>{profile.name}</h2>
              <div className={styles.userInfo}>
                <span>{profile.phone}</span>
                {profile.email && <span>{profile.email}</span>}
              </div>
              <button onClick={handleEditClick} className={styles.editProfileBtn}>
                Edit Profile
              </button>
            </>
          ) : (
            <div style={{ width: "100%" }}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.inputField}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={styles.inputField}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={styles.inputField}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className={styles.editProfileBtn}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  className={styles.saveBtn}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Shortcuts group */}
        <section className={styles.menuGroup}>
          <button 
            onClick={() => router.push("/profile/addresses")}
            className={styles.menuItem}
          >
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                <MapPin size={18} />
              </div>
              <span className={styles.menuTitle}>Saved Addresses</span>
            </div>
            <ChevronRight size={16} className={styles.menuArrow} />
          </button>

          <button 
            onClick={() => alert("💳 Payment Methods: UPI, Cards & Netbanking options.")}
            className={styles.menuItem}
          >
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                <CreditCard size={18} />
              </div>
              <span className={styles.menuTitle}>Payment Methods</span>
            </div>
            <ChevronRight size={16} className={styles.menuArrow} />
          </button>

          <button 
            onClick={() => router.push("/orders")}
            className={styles.menuItem}
          >
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                <History size={18} />
              </div>
              <span className={styles.menuTitle}>Order History</span>
            </div>
            <ChevronRight size={16} className={styles.menuArrow} />
          </button>
        </section>

        {/* Logout Button */}
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

        <button className={`${styles.navItem} ${styles.navItemActive}`}>
          <div className={styles.navIconWrap}>
            <span className={styles.navActiveIndicator} />
            <UserIcon size={22} />
          </div>
          <span className={styles.navLabel}>Profile</span>
        </button>
      </nav>
    </main>
  );
}

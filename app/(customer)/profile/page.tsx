"use client";

import React, { useState, useEffect } from "react";
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
  User as UserIcon,
  Heart
} from "lucide-react";
import { auth, getUser, updateUser, onAuthChange, signOut } from "@/lib/firebase";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "Loading...",
    phone: "",
    email: "",
    avatar: "🧑‍💻",
    photoURL: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
        // Fetch custom user details from Firestore
        const userDetails = await getUser(firebaseUser.uid);
        if (userDetails) {
          setProfile({
            name: userDetails.name || "",
            phone: userDetails.phone || firebaseUser.phoneNumber || "",
            email: userDetails.email || firebaseUser.email || "",
            avatar: "🧑‍💻",
            photoURL: userDetails.photoURL || firebaseUser.photoURL || ""
          });
        } else {
          // Fallback to Auth properties
          setProfile({
            name: firebaseUser.displayName || "Customer",
            phone: firebaseUser.phoneNumber || "",
            email: firebaseUser.email || "",
            avatar: "🧑‍💻",
            photoURL: firebaseUser.photoURL || ""
          });
        }
      } else {
        // Not authenticated -> redirect to login
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!uid) return;
    try {
      await updateUser(uid, {
        name: editName,
        phone: editPhone,
        email: editEmail
      });
      setProfile(prev => ({
        ...prev,
        name: editName,
        phone: editPhone,
        email: editEmail
      }));
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      alert("❌ Failed to save profile details.");
    }
  };

  const handleEditClick = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditEmail(profile.email);
    setIsEditing(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      alert("👋 Logged out successfully!");
      router.push("/login");
    } catch {
      router.push("/login");
    }
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
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <span>{profile.avatar}</span>
            )}
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
            onClick={() => router.push("/favorites")}
            className={styles.menuItem}
          >
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                <Heart size={18} />
              </div>
              <span className={styles.menuTitle}>My Favorites</span>
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

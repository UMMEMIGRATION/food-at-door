"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Home, 
  Briefcase, 
  MapPin 
} from "lucide-react";
import { getUser, updateUser, onAuthChange } from "@/lib/firebase";
import styles from "./addresses.module.css";

interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export default function AddressManagementPage() {
  const router = useRouter();
  
  const [uid, setUid] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultId, setDefaultId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
        try {
          const userDetails = await getUser(firebaseUser.uid);
          if (userDetails) {
            setAddresses((userDetails.addresses as Address[]) || []);
            setDefaultId(userDetails.defaultAddressId || "");
          }
        } catch (err) {
          console.error("Failed to load user addresses:", err);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);
  
  // Form & Editing state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [state, setState] = useState("Telangana");
  const [pincode, setPincode] = useState("");

  const handleOpenAddForm = () => {
    setEditingAddress(null);
    setLabel("Home");
    setLine1("");
    setLine2("");
    setCity("Hyderabad");
    setState("Telangana");
    setPincode("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting default when clicking edit button
    setEditingAddress(addr);
    setLabel(addr.label);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsFormOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!line1 || !pincode) {
      alert("Please fill in the building line and pincode details.");
      return;
    }

    if (!uid) {
      alert("You must be logged in to modify addresses.");
      return;
    }

    let updatedAddresses: Address[] = [];
    if (editingAddress) {
      // Edit
      updatedAddresses = addresses.map(addr => addr.id === editingAddress.id ? {
        ...addr,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        lat: addr.lat || 17.4483,
        lng: addr.lng || 78.3741
      } : addr);
    } else {
      // Add
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        lat: 17.4483,
        lng: 78.3741
      };
      updatedAddresses = [...addresses, newAddr];
    }

    try {
      await updateUser(uid, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      alert(editingAddress ? "✅ Address updated successfully!" : "✅ New address added!");
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save address:", err);
      alert("❌ Failed to save address details.");
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!uid) return;

    if (confirm("Are you sure you want to delete this address?")) {
      const updated = addresses.filter(addr => addr.id !== id);
      const updates: any = { addresses: updated };
      if (defaultId === id) {
        updates.defaultAddressId = "";
      }

      try {
        await updateUser(uid, updates);
        setAddresses(updated);
        if (defaultId === id) {
          setDefaultId("");
        }
        alert("✅ Address deleted successfully!");
      } catch (err) {
        console.error("Failed to delete address:", err);
        alert("❌ Failed to delete address.");
      }
    }
  };

  const handleSelectDefault = async (id: string) => {
    if (!uid) return;
    try {
      await updateUser(uid, { defaultAddressId: id });
      setDefaultId(id);
      alert("📍 Default delivery address updated!");
    } catch (err) {
      console.error("Failed to set default address:", err);
      alert("❌ Failed to set default delivery address.");
    }
  };

  const getEmoji = (lbl: string) => {
    if (lbl === "Home") return "🏠";
    if (lbl === "Work") return "💼";
    return "📍";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0F172A", color: "#F8FAFC" }}>
        Loading saved addresses...
      </div>
    );
  }

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/profile")} 
          className={styles.backBtn}
          aria-label="Back to profile"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.headerTitle}>Saved Addresses</h1>
      </header>

      <div className={styles.scrollBody}>
        {!isFormOpen ? (
          <>
            {/* Address List */}
            <div className={styles.addressList}>
              {addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  onClick={() => handleSelectDefault(addr.id)}
                  className={`
                    ${styles.addressCard} 
                    ${defaultId === addr.id ? styles.addressCardSelected : ""}
                  `}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.labelWrapper}>
                      <span className={styles.addressEmoji}>{getEmoji(addr.label)}</span>
                      <h3 className={styles.label}>{addr.label}</h3>
                    </div>
                    {defaultId === addr.id && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>

                  <div className={styles.cardActions}>
                    <button 
                      onClick={(e) => handleOpenEditForm(addr, e)}
                      className={styles.actionBtn}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteAddress(addr.id, e)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleOpenAddForm} className={styles.addBtnFloating}>
              <Plus size={16} />
              <span>Add New Address</span>
            </button>
          </>
        ) : (
          /* Add/Edit Form */
          <section className={styles.formSection}>
            <h2 className={styles.formTitle}>
              {editingAddress ? "Edit Address Details" : "New Address Details"}
            </h2>
            
            <div className={styles.inputGroup}>
              {/* Type Selection */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                {(["Home", "Work", "Other"] as const).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setLabel(lbl)}
                    className={`${styles.cancelBtn} ${label === lbl ? styles.submitBtn : ""}`}
                    style={{ padding: "8px", fontSize: "12px", border: label === lbl ? "none" : undefined }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Building / Flat / Street Name *"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="Area / Landmark (Optional)"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="Pincode *"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.formActions}>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAddress} 
                className={styles.submitBtn}
              >
                Save Address
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

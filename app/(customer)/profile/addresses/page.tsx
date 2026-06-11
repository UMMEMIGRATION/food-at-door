"use client";

import React, { useState } from "react";
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
import styles from "./addresses.module.css";

interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    label: "Home",
    line1: "Flat 304, Srinivasa Heights",
    line2: "Ayyappa Society, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081"
  },
  {
    id: "addr-2",
    label: "Work",
    line1: "Phase 2, T-Hub building",
    line2: "Inorbit Mall Road, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081"
  }
];

export default function AddressManagementPage() {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [defaultId, setDefaultId] = useState<string>("addr-1");
  
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

  const handleSaveAddress = () => {
    if (!line1 || !pincode) {
      alert("Please fill in the building line and pincode details.");
      return;
    }

    if (editingAddress) {
      // Edit
      setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? {
        ...addr,
        label,
        line1,
        line2,
        city,
        state,
        pincode
      } : addr));
      alert("✅ Address updated successfully!");
    } else {
      // Add
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        label,
        line1,
        line2,
        city,
        state,
        pincode
      };
      setAddresses(prev => [...prev, newAddr]);
      alert("✅ New address added!");
    }
    setIsFormOpen(false);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this address?")) {
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      if (defaultId === id) {
        setDefaultId("");
      }
    }
  };

  const handleSelectDefault = (id: string) => {
    setDefaultId(id);
    alert("📍 Default delivery address updated!");
  };

  const getEmoji = (lbl: string) => {
    if (lbl === "Home") return "🏠";
    if (lbl === "Work") return "💼";
    return "📍";
  };

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

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener("backButton", (data) => {
      if (data.canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!pathname) return;
      setUser(currentUser);

      const isAuthRoute =
        pathname?.includes("/login") ||
        pathname?.includes("/signup") ||
        pathname?.includes("/forgot-password") ||
        pathname?.startsWith("/auth");

      if (!currentUser) {
        setLoading(false);
        if (!isAuthRoute) {
          router.replace("/login");
        }
      } else {
        // User exists
        try {
          // If email is not verified, we must sign out and redirect to login, EXCEPT for auth verification flows and signup flow
          const onSignupPage = pathname?.includes("/signup");
          if (!currentUser.emailVerified && !currentUser.email?.endsWith("@example.com")) {
            const isPasswordProvider = currentUser.providerData.some(
              (p) => p.providerId === "password"
            );
            if (isPasswordProvider && !isAuthRoute && !onSignupPage) {
              // Not verified password login -> force signout/redirect
              await auth.signOut();
              setUser(null);
              setLoading(false);
              router.replace("/login?verified=false");
              return;
            }
          }

          // If authenticated and on login/signup page, redirect to home ONLY IF verified
          if (isAuthRoute && !onSignupPage) {
            const isPhoneProvider = currentUser.providerData.some(
              (p) => p.providerId === "phone"
            );
            const isVerified = currentUser.emailVerified || currentUser.email?.endsWith("@example.com") || isPhoneProvider;
            if (isVerified) {
              router.replace("/");
            } else {
              await auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Auth layout checking error:", e);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "sans-serif",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#FF6B35",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Loading session...</p>
      </div>
    );
  }

  return <>{children}</>;
}

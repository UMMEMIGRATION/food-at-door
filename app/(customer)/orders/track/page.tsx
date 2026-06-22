"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import OrderTrackingClient from "../[id]/OrderTrackingClient";

function TrackContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") || "";
  return <OrderTrackingClient params={{ id }} />;
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#fff" }}>
        Loading tracker...
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}

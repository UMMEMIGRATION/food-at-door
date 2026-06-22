import RestaurantDetailsClient from "./RestaurantDetailsClient";

export function generateStaticParams() {
  return [
    { id: "r1" },
    { id: "r2" },
    { id: "r3" },
    { id: "r4" },
    { id: "r5" },
    { id: "r6" },
    { id: "r7" },
    { id: "r8" },
    { id: "r9" },
    { id: "r10" },
    { id: "r11" }
  ];
}

export default function RestaurantDetailsPage({ params }: { params: { id: string } }) {
  return <RestaurantDetailsClient params={params} />;
}

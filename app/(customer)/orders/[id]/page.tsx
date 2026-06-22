import OrderTrackingClient from "./OrderTrackingClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  return <OrderTrackingClient params={params} />;
}

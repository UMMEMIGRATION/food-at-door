import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food At Door",
  description: "India's favourite food, delivered fast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

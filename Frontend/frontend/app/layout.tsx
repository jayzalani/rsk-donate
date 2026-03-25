import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSK Donate — Transparent Charity on Rootstock",
  description: "Bitcoin-secured milestone-based donations. Every cent tracked on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
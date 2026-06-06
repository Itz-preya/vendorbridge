import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "VendorBridge — Procurement & Vendor Management ERP",
  description:
    "Streamline procurement operations with VendorBridge. Manage vendors, RFQs, quotations, approvals, purchase orders, and invoices in one centralized platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Sell - Stationery Inventory Management",
  description: "Quickly sell products and manage sales transactions",
};

export default function QuickSellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

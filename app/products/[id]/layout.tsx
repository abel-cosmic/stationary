import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // Note: We can't use client hooks here, so we'll use a generic title
  // In a real app, you'd fetch the product server-side
  return {
    title: `Product Details - Stationery Inventory Management`,
    description: `View product details, analytics, and sell history`,
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

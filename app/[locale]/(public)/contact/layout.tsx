import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tile Collections — Mountain Ceramics Company",
  description: "Browse MCC tile collections. Select a collection to visualize tiles in a real room.",
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Contact", href: "/contact" },

    ]} />
    {children}</>;
}

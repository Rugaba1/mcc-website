import { PublicationsPageContent } from "@/components/publications-surface";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications & promotions",
  description: "Announcements, product news, and downloadable promotions from Mountain Ceramics Company.",
  openGraph: {
    title: "Publications & promotions",
    description: "Announcements, product news, and downloadable promotions from Mountain Ceramics Company.",
    type: "website",
  },
};

export default function PublicationsPage() {
  return <PublicationsPageContent />;
}

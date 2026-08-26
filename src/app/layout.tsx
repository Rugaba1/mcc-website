import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mountain Ceramics Company | Rwanda's Premier Tile Industry",
  description:
    "Mountain Ceramics Company (MCC) – Rwanda's leading professional tile manufacturer. Premium quality tiles for residential, commercial, and industrial projects in Kigali and across East Africa.",
  keywords: [
    "tiles Rwanda",
    "ceramic tiles Kigali",
    "porcelain tiles Rwanda",
    "tile manufacturer Rwanda",
    "Mountain Ceramics Company",
    "MCC tiles",
    "floor tiles Rwanda",
    "wall tiles Rwanda",
  ],
  openGraph: {
    title: "Mountain Ceramics Company | Rwanda's Premier Tile Industry",
    description:
      "Premium ceramic and porcelain tiles engineered for beauty, durability, and the demands of modern Rwandan architecture.",
    type: "website",
    locale: "en_RW",
    siteName: "Mountain Ceramics Company",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

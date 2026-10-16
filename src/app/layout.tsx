import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Mountain Ceramics Company",
        template: "%s | Mountain Ceramics Company",
    },
    description: "Mountain Ceramics Company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>{children}</body>
        </html>
    );
}

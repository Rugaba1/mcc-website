import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import "../../globals.css";
import { routing } from "@/app/i18n/routing";
import CartProvider from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import ThemeProvider from "@/components/theme-provider";
import Navbar from "@/components/Navbar";

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

const OG_LOCALES: Record<string, string> = {
    en: "en_RW",
    fr: "fr_RW",
    rw: "rw_RW",
};

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
        siteName: "Mountain Ceramics Company",
    },
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!routing.locales.includes(locale as any)) notFound();

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className={`${inter.variable} ${playfair.variable}`}
            suppressHydrationWarning
        >
            <body className="antialiased">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem={false}
                        disableTransitionOnChange
                    >
                        <AuthProvider>
                            <CartProvider>
                                <Navbar />
                                {children}
                            </CartProvider>
                        </AuthProvider>
                        <Toaster position="top-right" richColors closeButton theme="light" />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
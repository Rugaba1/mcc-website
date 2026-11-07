import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import "../globals.css";
import { routing } from "@/app/i18n/routing";
import CartProvider from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import ThemeProvider from "@/components/theme-provider";
import localFont from "next/font/local";
import { siteConfig } from "@/config/site.config";
import { FormatProvider } from "@/contexts/format-context";
import BackToTop from "@/components/BackToTop";
import { MediaPreviewProvider } from "@/components/media-preview-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const centuryGothic = localFont({
    src: [
        { path: "../../public/fonts/century/centurygothic.ttf", weight: "400", style: "normal" },
        { path: "../../public/fonts/century/centurygothic_bold.ttf", weight: "700", style: "normal" },
    ],
    variable: "--font-century-gothic",
    display: "swap",
});

const glovar = localFont({
    src: [
        { path: "../../public/fonts/glovar/glovar.otf", weight: "400", style: "normal" },
        { path: "../../public/fonts/glovar/glovar.otf", weight: "700", style: "normal" },
    ],
    variable: "--font-glovar",
    display: "swap",
})


export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.siteUrl),
    title: siteConfig.metadata.title,
    description: siteConfig.metadata.description,
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },
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
        title: siteConfig.metadata.title,
        description: siteConfig.metadata.description,
        type: "website",
        siteName: siteConfig.siteName,
        images: [{ url: "/images/mcc-inside-factory-machinery.jpg", width: 1200, height: 630, alt: siteConfig.siteName }],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.metadata.title,
        description: siteConfig.metadata.description,
        images: ["/images/mcc-inside-factory-machinery.jpg"],
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
    const requestHeaders = await headers();
    const nonce = requestHeaders.get("x-nonce") ?? undefined;
    const timeZone = requestHeaders.get("x-timezone") ?? siteConfig.defaultTimeZone;
    const messages = await getMessages();
    const companyJsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${siteConfig.siteUrl}/#website`,
                url: siteConfig.siteUrl,
                name: siteConfig.siteName,
                alternateName: [siteConfig.companyName, "MCC"],
                publisher: { "@id": `${siteConfig.siteUrl}/#organization` },
            },
            {
                "@type": "Organization",
                "@id": `${siteConfig.siteUrl}/#organization`,
                name: siteConfig.siteName,
                legalName: siteConfig.companyName,
                alternateName: "MCC",
                url: siteConfig.siteUrl,
                logo: new URL("/logo.png", siteConfig.siteUrl).toString(),
            },
            {
                "@type": "LocalBusiness",
                "@id": `${siteConfig.siteUrl}/#localbusiness`,
                name: siteConfig.siteName,
                url: siteConfig.siteUrl,
                image: new URL("/images/mcc-factory.jpg", siteConfig.siteUrl).toString(),
                parentOrganization: { "@id": `${siteConfig.siteUrl}/#organization` },
                telephone: [
                    siteConfig.companyPhone,
                    siteConfig.companyPhoneAlternate,
                ].filter(Boolean),
                address: {
                    "@type": "PostalAddress",
                    streetAddress: siteConfig.companyStreetAddress,
                    addressLocality: siteConfig.companyLocality,
                    addressRegion: siteConfig.companyRegion,
                    addressCountry: siteConfig.companyCountry,
                },
                email: siteConfig.companyEmail,
            },
        ],
    };

    return (
        <html lang={locale} className={`${centuryGothic.variable} ${glovar.variable}`} suppressHydrationWarning>
            <body className="font-sans h-full antialiased">
                <script
                    type="application/ld+json"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(companyJsonLd).replace(/</g, "\\u003c"),
                    }}
                />
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <ServiceWorkerRegistration />
                    <ThemeProvider
                        nonce={nonce}
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <FormatProvider
                            initialTimeZone={timeZone}
                            secureCookie={siteConfig.isProduction}
                        >
                            <AuthProvider>
                                <MediaPreviewProvider>
                                    <CartProvider>{children}</CartProvider>
                                </MediaPreviewProvider>
                            </AuthProvider>
                        </FormatProvider>
                        <Toaster position="top-right" richColors closeButton theme="system" />
                        <BackToTop />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
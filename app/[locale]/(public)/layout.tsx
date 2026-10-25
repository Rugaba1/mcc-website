
import Footer from "@/components/Footer";
import Navbar from "../../../components/Navbar";
import CookieConsent from "@/components/cookie-consent";
import { siteConfig } from "@/config/site.config";
import { headers } from "next/headers";

export default async function Publicayout({ children }: { children: React.ReactNode }) {
    const requestHeaders = await headers();
    const nonce = requestHeaders.get("x-nonce") ?? undefined;

    return (
        <>
            <Navbar />

            {children}
            <CookieConsent
                analyticsId={siteConfig.googleAnalyticsId}
                nonce={nonce}
            />
            <Footer />

        </>
    );
}

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/app/i18n/routing";
import ThemeProvider from "@/components/theme-provider";
import CartProvider from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!routing.locales.includes(locale as any)) notFound();

    const messages = await getMessages();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
            >
                <AuthProvider>
                    <CartProvider>{children}</CartProvider>
                </AuthProvider>
                <Toaster position="top-right" richColors closeButton theme="light" />
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
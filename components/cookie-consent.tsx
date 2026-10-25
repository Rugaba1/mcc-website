"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart3, Cookie, Settings2, ShieldCheck } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const CONSENT_COOKIE = "mcc_cookie_consent";
const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_SECONDS * 1000;

type CookieConsentValue = {
  version: number;
  analytics: boolean;
  updatedAt: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsent(): CookieConsentValue | null {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);

  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("analytics" in parsed) ||
      !("updatedAt" in parsed) ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }

    const age = Date.now() - parsed.updatedAt;
    if (!Number.isFinite(parsed.updatedAt) || age < 0 || age >= CONSENT_MAX_AGE_MS) {
      return null;
    }

    return {
      version: parsed.version,
      analytics: parsed.analytics,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name?.startsWith("_ga")) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    }
  }
}

function setAnalyticsPermission(measurementId: string, allowed: boolean) {
  if (!measurementId) return;

  Reflect.set(window, `ga-disable-${measurementId}`, !allowed);
  if (!allowed) clearAnalyticsCookies();
}

function GoogleAnalytics({
  measurementId,
  nonce,
}: {
  measurementId: string;
  nonce?: string;
}) {
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dataLayer = window.dataLayer ?? [];
    window.dataLayer = dataLayer;
    window.gtag ??= (...args: unknown[]) => dataLayer.push(args);
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: "none",
      cookie_expires: CONSENT_MAX_AGE_SECONDS,
    });
    setInitialized(true);
  }, [measurementId]);

  useEffect(() => {
    if (!loaded) return;
    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [loaded, pathname]);

  if (!initialized) return null;

  return (
    <Script
      id="mcc-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      nonce={nonce}
      onReady={() => setLoaded(true)}
      onError={(error) => console.error("Could not load the opted-in analytics script:", error)}
    />
  );
}

export default function CookieConsent({
  analyticsId,
  nonce,
}: {
  analyticsId: string;
  nonce?: string;
}) {
  const t = useTranslations("cookieConsent");
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    setConsent(saved);
    setDraftAnalytics(saved?.analytics ?? false);
    setAnalyticsPermission(analyticsId, saved?.analytics ?? false);
    setReady(true);
  }, [analyticsId]);

  function savePreferences(analytics: boolean) {
    const nextConsent: CookieConsentValue = {
      version: CONSENT_VERSION,
      analytics: Boolean(analyticsId && analytics),
      updatedAt: Date.now(),
    };

    setAnalyticsPermission(analyticsId, nextConsent.analytics);
    setConsent(nextConsent);
    setDraftAnalytics(nextConsent.analytics);
    let persisted = false;

    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(nextConsent))}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
      persisted = readConsent()?.updatedAt === nextConsent.updatedAt;
    } catch (error) {
      console.error("Could not persist cookie consent:", error);
    }

    if (!persisted) console.error("Cookie consent could not be verified in browser storage.");
    setSettingsOpen(!persisted);
    setStorageError(!persisted);
  }

  function openSettings() {
    setDraftAnalytics(consent?.analytics ?? false);
    setSettingsOpen(true);
  }

  if (!ready) return null;

  return (
    <>
      {consent?.analytics && analyticsId ? (
        <GoogleAnalytics measurementId={analyticsId} nonce={nonce} />
      ) : null}

      {consent === null || settingsOpen ? (
        <Card
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-3 bottom-3 z-100 mx-auto max-h-[85vh] max-w-3xl gap-0 overflow-y-auto border-border bg-card p-0 text-card-foreground shadow-2xl sm:inset-x-6 sm:bottom-6"
        >
          <CardHeader className="gap-3 border-b px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-none">{t("title")}</h2>
                <CardDescription className="mt-2 leading-relaxed">
                  {t("message")}{" "}
                  <Link href="/legal/privacy-policy" className="font-medium text-primary underline underline-offset-4">
                    {t("privacyPolicy")}
                  </Link>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {settingsOpen ? (
            <CardContent className="grid gap-4 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <Checkbox checked disabled aria-label={t("necessaryLabel")} />
                <div>
                  <p className="text-sm font-semibold">{t("necessaryLabel")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("necessaryDesc")}</p>
                </div>
              </div>

              {analyticsId ? (
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={draftAnalytics}
                    onCheckedChange={(checked) => setDraftAnalytics(checked === true)}
                    aria-label={t("analyticsLabel")}
                  />
                  <div>
                    <p className="text-sm font-semibold">{t("analyticsLabel")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("analyticsDesc")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("analyticsUnavailable")}</p>
              )}
            </CardContent>
          ) : null}

          {storageError ? (
            <p role="status" className="px-5 pb-2 text-sm text-destructive sm:px-6">
              {t("storageError")}
            </p>
          ) : null}

          <CardFooter className="flex flex-col-reverse items-stretch gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {settingsOpen ? (
              <>
                {consent !== null ? (
                  <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
                    {t("cancel")}
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => savePreferences(false)}>
                  {t("necessaryOnly")}
                </Button>
                {analyticsId ? (
                  <Button variant="outline" onClick={() => savePreferences(true)}>
                    {t("accept")}
                  </Button>
                ) : null}
                <Button onClick={() => savePreferences(draftAnalytics)}>
                  {t("savePreferences")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => savePreferences(false)}>
                  {t("necessaryOnly")}
                </Button>
                <Button variant="ghost" onClick={openSettings}>
                  <Settings2 aria-hidden="true" />
                  {t("customize")}
                </Button>
                <Button onClick={() => savePreferences(true)}>
                  {t("accept")}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed bottom-3 left-3 z-100 gap-2 bg-background shadow-md sm:bottom-6 sm:left-6"
          aria-pressed={settingsOpen}
          onClick={openSettings}
        >
          <Cookie aria-hidden="true" />
          <BarChart3 aria-hidden="true" className="size-3.5" />
          {t("changeSettings")}
        </Button>
      )}
    </>
  );
}

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "./token-store";
import { defaultLocale, supportedLocales } from "./constants";
import { siteConfig } from "@/config/site.config";

export const API_BASE_URL = siteConfig.apiBaseUrl;

const REFRESH_URL = "/api/auth/refresh";

// A 401 from these means "wrong credentials/code", not "expired session"
const NO_REFRESH_URLS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const currentLocale = (): string => {
  if (typeof window === "undefined") return defaultLocale;
  const seg = window.location.pathname.split("/")[1];
  return (supportedLocales as readonly string[]).includes(seg)
    ? seg
    : defaultLocale;
};

// One shared in-flight refresh: every concurrent 401 awaits the same promise
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= api
    .post(REFRESH_URL, {}, { timeout: 15_000 })
    .then(({ data }) => {
      const { accessToken, user } = data;
      tokenStore.set({ accessToken, user });
      return accessToken as string;
    })
    .catch((err) => {
      tokenStore.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:expired"));
      }
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get()?.accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers["Accept-Language"]) {
    config.headers["Accept-Language"] = currentLocale();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 428 &&
      (error.response.data as { code?: string } | undefined)?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
      typeof window !== "undefined"
    ) {
      const path = window.location.pathname;
      if (!path.includes("/legal/accept") && !path.includes("/admin/legal")) {
        const locale = currentLocale();
        const prefix = locale === defaultLocale ? "" : `/${locale}`;
        const next = path.replace(/^\/(en|fr|rw)(?=\/|$)/, "") || "/";
        const destination = new URL(`${prefix}/legal/accept`, window.location.origin);
        destination.searchParams.set("next", next);
        window.location.assign(destination.toString());
      }
      return Promise.reject(error);
    }

    const shouldRefresh =
      original &&
      error.response?.status === 401 &&
      !original._retry &&
      !NO_REFRESH_URLS.some((u) => original.url?.includes(u));

    if (!shouldRefresh) return Promise.reject(error);

    original._retry = true; // set for queued requests too, so nothing loops

    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      return Promise.reject(error); // surface the original 401 to the caller
    }
  },
);

export const apiClient = api;
export default apiClient;

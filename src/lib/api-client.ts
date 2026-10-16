import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "@/lib/token-store";
import { defaultLocale, supportedLocales } from "./constants";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

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
  headers: { "Content-Type": "application/json" },
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
  refreshPromise ??= axios
    .post(
      `${API_BASE_URL}${REFRESH_URL}`,
      {},
      {
        withCredentials: true,
        timeout: 15_000,
        headers: { "Accept-Language": currentLocale() },
      },
    )
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

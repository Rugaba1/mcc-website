"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/app/i18n/routing";
import apiClient, { refreshAccessToken } from "@/lib/api-client";
import { tokenStore, type AuthUser } from "@/lib/token-store";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true until the first session restore attempt finishes
  isLoading: boolean; // login / logout in progress
  login: (identifier: string, password: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Single source of truth is tokenStore, so no duplicated React state to drift
  const session = useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.get,
    () => null,
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // already locale-aware, so never prefix paths with the locale
  const t = useTranslations("auth");

  // Restore the session once on app load (also covers page reloads)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.get()) {
        try {
          await refreshAccessToken();
        } catch {
          /* guest: no valid refresh cookie, which is fine */
        }
      }
      if (!cancelled) setIsInitializing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, redirectTo = "/account") => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.post("/api/auth/login", {
          identifier,
          password,
        });
        tokenStore.set({ accessToken: data.accessToken, user: data.user });
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      /* clear locally even if the server call fails */
    } finally {
      setIsLoading(false);
    }
    tokenStore.clear();
    toast.success(t("logoutSuccess"));
    router.push("/login");
  }, [router, t]);

  const refresh = useCallback(async () => {
    await refreshAccessToken(); // updates or clears tokenStore itself
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: !!session,
      isInitializing,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [session, isInitializing, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
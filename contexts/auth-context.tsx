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
import { api, refreshAccessToken } from "@/lib/api";
import { tokenStore, type AuthUser } from "@/lib/token-store";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true until the first session restore attempt finishes
  isLoading: boolean; // login / logout in progress
  login: (
    identifier: string,
    password: string,
    redirectTo?: string,
    verification?: { challenge: string; code: string },
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export type LoginResult =
  | { accountDisabled: true }
  | { emailVerificationRequired: true }
  | {
      twoFactorRequired: true;
      method: "email" | "authenticator";
      challenge: string;
      message: string;
    }
  | { twoFactorRequired: false };

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
  const router = useRouter();
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
    async (
      identifier: string,
      password: string,
      redirectTo = "/account",
      verification?: { challenge: string; code: string },
    ): Promise<LoginResult> => {
      setIsLoading(true);
      try {
        const data = await api.authenticate({
          identifier,
          password,
          next: redirectTo,
          ...verification,
        });

        if (data.emailVerificationRequired) {
          return { emailVerificationRequired: true };
        }

        if (data.accountDisabled) {
          return { accountDisabled: true };
        }

        if (data.twoFactorRequired) {
          if (!data.method || !data.challenge || !data.message) {
            throw new Error("The two-factor response was incomplete.");
          }
          return {
            twoFactorRequired: true,
            method: data.method,
            challenge: data.challenge,
            message: data.message,
          };
        }

        if (!data.accessToken || !data.user) {
          throw new Error("The login response was incomplete.");
        }
        tokenStore.set({
          accessToken: data.accessToken,
          user: {
            id: String(data.user.id),
            firstName: data.user.firstName,
            lastName: data.user.lastName ?? undefined,
            email: data.user.email,
            phoneNumber: data.user.phoneNumber,
            profilePicture: data.user.profilePicture,
            role: {
              id: String(data.user.role.id),
              roleName: data.user.role.roleName,
            },
            permissions: data.user.permissions,
          },
        });
        router.push(redirectTo);
        return { twoFactorRequired: false };
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    let serverLogoutSucceeded = false;
    try {
      await api.logout();
      serverLogoutSucceeded = true;
    } catch {
      console.error("Logout request failed; clearing the local session.");
    } finally {
      setIsLoading(false);
    }
    tokenStore.clear();
    if (serverLogoutSucceeded) {
      toast.success(t("logoutSuccess"));
    } else {
      toast.error("Could not revoke the server session. Please try again.");
    }
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
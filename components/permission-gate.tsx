"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { hasAnyPermission, hasPermissions } from "@/lib/permissions/core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export type PermissionRequirement = string | readonly string[];
export type AccessAvailability = "available" | "disabled" | "removed";

interface PermissionGateProps {
  children: ReactNode;
  required?: PermissionRequirement;
  requiredAny?: readonly string[];
  mode?: "hide" | "message";
  availability?: AccessAvailability;
  className?: string;
}

export function PermissionGate({
  children,
  required,
  requiredAny,
  mode = "hide",
  availability = "available",
  className,
}: PermissionGateProps) {
  const { user, isInitializing } = useAuth();
  const t = useTranslations("accessGate");

  if (isInitializing) {
    return mode === "hide" ? null : <Skeleton className="h-24 w-full" />;
  }

  const isAvailable = availability === "available";
  const isAuthorized =
    (!required && !requiredAny) ||
    Boolean(
      user &&
        ((!required || hasPermissions(user.permissions, required)) &&
          (!requiredAny || hasAnyPermission(user.permissions, requiredAny))),
    );

  if (isAvailable && isAuthorized) return children;
  if (mode === "hide") return null;

  const state = !isAvailable ? availability : "denied";
  const title =
    state === "disabled"
      ? t("disabledTitle")
      : state === "removed"
        ? t("removedTitle")
        : t("deniedTitle");
  const description =
    state === "disabled"
      ? t("disabledDescription")
      : state === "removed"
        ? t("removedDescription")
        : t("deniedDescription");

  return (
    <Alert className={className} variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        <Link
          className="mt-2 inline-block min-h-11 py-2 font-medium underline underline-offset-4"
          href="/contact"
        >
          {t("contactSupport")}
        </Link>
      </AlertDescription>
    </Alert>
  );
}

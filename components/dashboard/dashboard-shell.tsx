"use client";

import { useState } from "react";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "@/app/i18n/routing";
import { isStaffUser } from "@/lib/roles";
import { adminNav, customerNav } from "./nav";
import { MobileSidebar, SidebarContent } from "../sidebar";
import CartButton from "../cart-button";
import { Avatar, AvatarFallback } from "../ui/avatar";


export function DashboardShell({
    area,
    children,
}: {
    area: "account" | "admin";
    children: React.ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();
    const pathname = usePathname();

    const nav = area === "admin" ? adminNav : customerNav;
    const currentPage = [...nav]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) =>
            item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`),
        );
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

    return (
        <div className="flex h-screen overflow-hidden">
            <aside
                className={`sticky  hidden h-screen shrink-0 border-r bg-sidebar transition-all duration-300 md:block ${collapsed ? "w-16" : "w-64"
                    }`}
            >
                <SidebarContent nav={nav} area={area} collapsed={collapsed} />
            </aside>

            <MobileSidebar
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                nav={nav}
                area={area}
            />

            <main className="flex-1 overflow-y-scroll bg-background pb-20 md:pb-0">
                <header className="sticky top-0 z-30 mx-auto flex h-14 items-center justify-between border-b bg-background/95 px-2.5 backdrop-blur-sm md:px-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:inline-flex"
                        onClick={() => setCollapsed((c) => !c)}
                        aria-label="Toggle sidebar"
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>

                    <div className="min-w-0 flex-1 px-3">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {area === "admin" ? "Administration" : "My account"}
                        </p>
                        <h1 className="truncate text-sm font-semibold md:text-base">
                            {currentPage?.name ?? (area === "admin" ? "Admin" : "Account")}
                        </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:gap-3">
                        {displayName && (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Avatar className="size-8">
                                    <AvatarFallback>{initials || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="hidden leading-tight md:block">
                                    <p className="max-w-40 truncate text-xs font-medium">{displayName}</p>
                                    <p className="text-[10px] capitalize text-muted-foreground">
                                        {area === "admin" && isStaffUser(user)
                                            ? user?.role.roleName.replace(/_/g, " ")
                                            : "Customer account"}
                                    </p>
                                </div>
                            </div>
                        )}
                        {area === "admin" && isStaffUser(user) && (
                            <Badge variant="secondary" className="hidden sm:inline-flex">Staff</Badge>
                        )}
                        {area === "account" && <CartButton />}
                    </div>
                </header>

                <div className="container mx-auto px-4 pt-4">{children}</div>
            </main>
        </div>
    );
}
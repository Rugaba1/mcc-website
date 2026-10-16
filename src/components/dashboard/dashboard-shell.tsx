"use client";

import { useState } from "react";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { isStaffUser } from "@/lib/roles";
import { adminNav, customerNav } from "./nav";
import { MobileSidebar, SidebarContent } from "../sidebar";


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

    const nav = area === "admin" ? adminNav : customerNav;

    return (
        // 4rem = your Navbar height; change it if the navbar is a different size
        <div className="flex min-h-[calc(100vh-4rem)]">
            <aside
                className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r bg-sidebar transition-all duration-300 md:block ${collapsed ? "w-16" : "w-64"
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

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-14 items-center gap-2 w-full border-b bg-background/95 px-3 backdrop-blur">
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

                    <div className="ml-auto flex items-center gap-2">
                        {isStaffUser(user) && (
                            <Badge variant="secondary">{user?.role.roleName}</Badge>
                        )}
                    </div>
                </header>

                <main className="flex-1 px-4 py-6">{children}</main>
            </div>
        </div>
    );
}
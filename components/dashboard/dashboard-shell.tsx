"use client";

import { useState } from "react";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { isStaffUser } from "@/lib/roles";
import { adminNav, customerNav } from "./nav";
import { MobileSidebar, SidebarContent } from "../sidebar";
import CartButton from "../cart-button";


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
                <header className="flex justify-between border-b h-14 items-center sticky mx-auto px-2.5 top-0 z-30 bg-background backdrop-blur-sm bg-opacity-95">
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

                    <div className=" flex items-center gap-2">
                        {/* {isStaffUser(user) ? (
                            <Badge variant="secondary">{user?.role.roleName}</Badge>
                        ) : <CartButton />} */}
                        <CartButton />
                    </div>
                </header>

                <div className="container mx-auto px-4 pt-4">{children}</div>
            </main>
        </div>
    );
}
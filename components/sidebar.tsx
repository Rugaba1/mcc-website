"use client";

import { ChevronUp, LogOut, Settings, Store, Shield } from "lucide-react";
import { Link, usePathname } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { isStaffUser } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "./ui/sheet";
import { NavItem } from "./dashboard/nav";
5

type Area = "account" | "admin";

function isActive(pathname: string, item: NavItem) {
    return item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function SidebarContent({
    nav,
    area,
    collapsed = false,
    onLinkClick,
}: {
    nav: NavItem[];
    area: Area;
    collapsed?: boolean;
    onLinkClick?: () => void;
}) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const staff = isStaffUser(user);
    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

    return (
        <div className="flex h-full w-full flex-col">
            <div className="flex h-14 items-center border-b px-3">
                <Link
                    href="/"
                    onClick={onLinkClick}
                    className="flex items-center gap-2 font-semibold"
                >
                    <span className="flex  items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Mountain Ceramics Company"
                            height={60}
                            width={60}
                            unoptimized />
                    </span>
                    {!collapsed && (
                        <span className="font-serif text-lg tracking-tight">
                            {area === "admin" ? "Admin" : "My Account"}
                        </span>
                    )}
                </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                {nav.map((item) => {
                    const active = isActive(pathname, item);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center  px-3 py-2 text-sm font-medium transition-colors",
                                collapsed ? "justify-center" : "gap-3",
                                active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{initials || "U"}</AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <>
                                    <span className="flex-1 truncate text-left text-sm font-medium">
                                        {user?.firstName} {user?.lastName}
                                    </span>
                                    <ChevronUp className="h-4 w-4 shrink-0" />
                                </>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56">
                        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/account/settings" onClick={onLinkClick}>
                                <Settings className="mr-2 h-4 w-4" /> Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/" onClick={onLinkClick}>
                                <Store className="mr-2 h-4 w-4" /> Back to shop
                            </Link>
                        </DropdownMenuItem>
                        {staff && (
                            <DropdownMenuItem asChild>
                                <Link href={area === "admin" ? "/account" : "/admin"} onClick={onLinkClick}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    {area === "admin" ? "My account" : "Admin panel"}
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => {
                                onLinkClick?.();
                                void logout();
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export function MobileSidebar({
    open,
    onOpenChange,
    nav,
    area,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nav: NavItem[];
    area: Area;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-72 p-0">
                {/* Radix requires a title and description for screen readers */}
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Dashboard navigation menu</SheetDescription>
                <SidebarContent nav={nav} area={area} onLinkClick={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    );
}
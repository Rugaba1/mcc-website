"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import CartButton from "./cart-button";
import { Link, usePathname } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ChevronRight, Menu } from "lucide-react";
import { CurrencySelector } from "@/components/currency-selector";
import { COMPANY } from "@/lib/company";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Blogs", href: "/blog" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Publications", href: "/publications" },
  { label: "Collections", href: "/collections" },
  { label: "Projects", href: "/projects" },
  { label: "Visualizer", href: "/visualizer" },
  { label: "Why Us", href: "/why-us" },
  { label: "Contact", href: "/contact" },

];
const primaryLinks = new Set([
  "/",
  "/products",
  "/catalogue",
  "/publications",
  "/collections",
  "/contact",
  "/visualizer",
]);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`${scrolled ? "fixed" : "relative"} top-0 left-0 right-0 z-50  transition-all duration-500 ${scrolled
        ? "bg-inverse backdrop-blur-lg   py-0"
        : "bg-background py-2"
        }`}
    >
      <Sheet open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
        <div className="mx-auto flex h-20 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <SheetTrigger asChild>
              <Button
                className="  flex-col gap-1.25 p-2 z-50 hidden shrink-0 lg:flex"
                variant="ghost"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 `} />
                <span className={`block w-4 h-0.5 bg-primary transition-all duration-300 `} />
                <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300  `} />
              </Button>
            </SheetTrigger>

            {/* Logo */}
            <Link href="/" className="group flex shrink-0 items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Mountain Ceramics Company"
                  fill
                  className="object-contain"
                  priority
                  sizes="40px"
                />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <span className="font-bold font-serif  text-[15px] tracking-wide">Mountain Ceramics</span>
                <span className=" text-[10px] tracking-[0.25em] uppercase">Company · Rwanda</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {links.filter((link) => primaryLinks.has(link.href)).map((l) => {
                const active = isActive(l.href);
                const cls = `group relative px-3 py-2 text-md font-medium transition-colors font-serif duration-200 ${active ? "text-primary" : ""}`;
                const underline = (
                  <span className={`absolute bottom-0 left-3 right-3 h-px bg-primary transition-all duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                );
                return (
                  <Link key={l.href} href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                    {l.label}
                    {underline}
                  </Link>
                );
              })}
            </nav>


            <CurrencySelector />
            <CartButton />
            <Button
              className="flex flex-col gap-1.25 p-2 z-50 lg:hidden"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.75" : ""}`} />
              <span className={`block w-4 h-0.5 bg-primary transition-all duration-300 ${mobileMenuOpen ? "opacity-0 w-6" : ""}`} />
              <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1.75" : ""}`} />
            </Button>
          </div>
        </div>

        <div
          className={`lg:hidden overflow-hidden backdrop-blur-xl transition-all duration-300 ${mobileMenuOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0"}`}
        >
          <nav className="flex flex-col gap-1 px-6 py-6" aria-label="Mobile navigation">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between border-b py-3.5  text-base font-medium transition-colors ${active ? "border-primary text-primary" : "border-border/50"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex w-full justify-between font-serif">
                    {link.label}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
            {user ? (
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-5 text-sm font-bold uppercase tracking-widest">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                {user.firstName}
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="mt-4 w-full text-sm font-bold uppercase tracking-widest" variant="outline">Login</Button>
              </Link>
            )}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 bg-primary px-5 py-4 text-center text-sm font-bold uppercase tracking-widest text-primary-foreground"
            >
              Get a Free Quote
            </Link>
          </nav>
        </div>

        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Explore Mountain Ceramics</SheetTitle>
            <SheetDescription>Browse the store and company information.</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4 pb-6" aria-label="More navigation">
            {links.filter((link) => !primaryLinks.has(link.href)).map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setDesktopMenuOpen(false)}
                  className={`border-b py-3 text-sm font-medium transition-colors ${active ? "border-primary text-primary" : "border-border/50 hover:text-primary"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="grid gap-1 border-b py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
              <Link href="/legal/terms-and-conditions" onClick={() => setDesktopMenuOpen(false)} className="py-1 text-sm hover:text-primary">Terms and Conditions</Link>
              <Link href="/legal/terms-of-service" onClick={() => setDesktopMenuOpen(false)} className="py-1 text-sm hover:text-primary">Terms of Service</Link>
              <Link href="/legal/privacy-policy" onClick={() => setDesktopMenuOpen(false)} className="py-1 text-sm hover:text-primary">Privacy Policy</Link>
            </div>
            {links.filter((link) => primaryLinks.has(link.href)).map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setDesktopMenuOpen(false)}
                  className={`border-b py-3 text-sm font-medium transition-colors lg:hidden ${active ? "border-primary text-primary" : "border-border/50 hover:text-primary"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            {user ? <Link href="/account" onClick={() => setDesktopMenuOpen(false)} className="flex items-center gap-2 border-b py-4 text-sm font-bold uppercase tracking-widest">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
              {user.firstName}
            </Link> : <Link href="/login" onClick={() => setDesktopMenuOpen(false)} className="mt-4">
              <Button className="w-full text-sm font-bold uppercase tracking-widest" variant="outline">Login</Button>
            </Link>}
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="mt-3 py-2 text-sm text-muted-foreground hover:text-primary"
            >
              Call us: {COMPANY.phone}
            </a>
            <Link
              href="/contact"
              onClick={() => setDesktopMenuOpen(false)}
              className="mt-3 bg-primary px-5 py-4 text-center text-sm font-bold uppercase tracking-widest text-primary-foreground"
            >
              Get a Free Quote
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

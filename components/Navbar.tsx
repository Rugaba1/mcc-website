"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Button } from "./ui/button";
import CartButton from "./cart-button";
import { Link, usePathname } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ChevronRight, Loader2, Menu, Search } from "lucide-react";
import { CurrencySelector } from "@/components/currency-selector";
import { COMPANY } from "@/lib/company";
import { api, apiErrorMessage, type Category, type Product } from "@/lib/api";
import { MediaImage } from "@/components/media-image";
import { ProductStartingPrice } from "@/components/product-starting-price";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

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

const productCategories: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "floor", label: "Floor" },
  { value: "wall", label: "Wall" },
  { value: "outdoor", label: "Outdoor" },
  { value: "special", label: "Special Finish" },
];
const productBadges = ["All", "Bestseller", "New", "Premium"] as const;

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debouncedValue;
}

function ProductSearchPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [badge, setBadge] = useState<(typeof productBadges)[number]>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchKeyRef = useRef("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const locale = useLocale();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;
    searchKeyRef.current = `${debouncedQuery.trim()}\u0000${category}\u0000${badge}`;
    setLoading(true);
    setError("");

    api.getProducts({
      search: debouncedQuery.trim() || undefined,
      skip: 0,
      limit: 12,
      status: "ACTIVE",
      category: category === "all" ? undefined : category,
      badge: badge === "All" ? undefined : badge,
      sort: "newest",
    })
      .then((response) => {
        if (!active) return;
        setProducts(response.products);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(1);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(apiErrorMessage(cause, "Could not search products."));
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [badge, category, debouncedQuery]);

  async function loadMore() {
    if (loadingMore || page >= totalPages) return;
    const searchKey = `${debouncedQuery.trim()}\u0000${category}\u0000${badge}`;
    setLoadingMore(true);
    setError("");
    try {
      const response = await api.getProducts({
        search: debouncedQuery.trim() || undefined,
        skip: page * 12,
        limit: 12,
        status: "ACTIVE",
        category: category === "all" ? undefined : category,
        badge: badge === "All" ? undefined : badge,
        sort: "newest",
      });
      if (searchKeyRef.current !== searchKey) return;
      setProducts((current) => [...current, ...response.products]);
      setPage(response.page);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (cause) {
      setError(apiErrorMessage(cause, "Could not load more products."));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products by name, colour, collection, size or SKU"
          aria-label="Search products"
          className="h-11 rounded-full pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter products by category">
        {productCategories.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={category === item.value ? "secondary" : "outline"}
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter products by label">
        {productBadges.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={badge === item ? "secondary" : "outline"}
            aria-pressed={badge === item}
            onClick={() => setBadge(item)}
          >
            {item === "All" ? "All labels" : item}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {!error && loading && (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" />
          Searching products…
        </div>
      )}
      {!error && !loading && products.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No products match your search. Try another name, colour, size or filter.
        </p>
      )}
      {!loading && products.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? "product" : "products"} found
          </p>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug ?? product.id}`}
                onClick={onClose}
                className="group flex h-fit flex-col items-stretch justify-start gap-2 rounded-xl border border-border/60 bg-background p-2 text-left transition-all hover:border-primary hover:shadow-sm sm:p-3"
              >
                {product.image ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted">
                    <Search className="size-6 text-muted-foreground/40" />
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {product.categoryLabel}
                  {product.badge ? ` · ${product.badge}` : ""}
                </span>
                <span className="line-clamp-2 text-xs font-semibold text-foreground">
                  {product.name}
                </span>
                <ProductStartingPrice variants={product.variants} locale={locale} />
              </Link>
            ))}
          </div>
          {page < totalPages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-center"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore && <Loader2 className="size-4 animate-spin" />}
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;
  const navAccent = scrolled ? "bg-inverse-foreground" : "bg-primary";
  const activeNavText = scrolled ? "text-inverse-foreground" : "text-primary";
  const activeNavBorder = scrolled
    ? "border-inverse-foreground"
    : "border-primary";

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
        : "bg-transparent py-0 sm:py-2"
        }`}
    >
      <Sheet open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
        <div className="mx-auto flex h-16 w-full items-center justify-between px-3 sm:h-20 sm:px-[clamp(0.75rem,2vw,1.5rem)]">
          <div className="flex shrink-0 items-center gap-[clamp(0.25rem,1vw,0.75rem)]">
            <Button
              className="flex flex-col gap-1.25 p-2 xl:hidden"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-primary-navigation"
            >
              <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.75" : ""}`} />
              <span className={`block h-0.5 w-4 ${navAccent} ${mobileMenuOpen ? "w-6 opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1.75" : ""}`} />
            </Button>
            <SheetTrigger asChild>
              <Button
                className="  flex-col gap-1.25 p-2 z-50 hidden shrink-0 xl:flex"
                variant="ghost"
                aria-label="Open additional navigation"
                aria-expanded={desktopMenuOpen}
              >
                <span className="block h-0.5 w-6 bg-current transition-all duration-300" />
                <span className={`block h-0.5 w-4 transition-all duration-300 ${navAccent}`} />
                <span className="block h-0.5 w-6 bg-current transition-all duration-300" />
              </Button>
            </SheetTrigger>

            {/* Logo */}
            <Link href="/" className="group flex shrink-0 items-center gap-[clamp(0.375rem,1vw,0.75rem)]">
              <div className="relative h-[clamp(3.5rem,6vw,5rem)] w-[clamp(3.5rem,6vw,5rem)] shrink-0">
                <Image
                  src="/logo-trans.png"
                  alt="Mountain Ceramics Company"
                  fill
                  className="object-contain"
                  priority
                  sizes="120px"
                />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <span className="font-bold font-serif  text-[15px] tracking-wide">Mountain Ceramics</span>
                <span className=" text-[10px] tracking-[0.25em] uppercase">Company · Rwanda</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-[clamp(0.375rem,1vw,0.75rem)]">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-[clamp(0.375rem,1vw,1rem)] xl:flex" aria-label="Main navigation">
              {links.filter((link) => primaryLinks.has(link.href)).map((l) => {
                const active = isActive(l.href);
                const cls = `group relative flex min-h-11 items-center px-[clamp(0.5rem,0.9vw,0.75rem)] py-2 text-md font-medium transition-colors font-serif duration-200 ${active ? activeNavText : ""}`;
                const underline = (
                  <span className={`absolute bottom-0 left-3 right-3 h-px transition-all duration-300 ${navAccent} ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                );
                return (
                  <Link key={l.href} href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                    {l.label}
                    {underline}
                  </Link>
                );
              })}
            </nav>


            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" className="size-5" />
            </Button>
            <CurrencySelector className="w-[clamp(4.5rem,24vw,6.5rem)] px-[clamp(0.25rem,0.8vw,0.75rem)]" />
            <CartButton />
          </div>
        </div>

        <div
          id="mobile-primary-navigation"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
          className={`xl:hidden overflow-hidden backdrop-blur-xl transition-all duration-300 ${mobileMenuOpen
            ? "fixed inset-x-0 top-16 z-[60] min-h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-y-auto bg-background shadow-xl"
            : "max-h-0"
            }`}
        >
          <nav className="flex flex-col gap-[clamp(0.25rem,1vh,0.5rem)] px-[clamp(1rem,5vw,1.5rem)] py-6" aria-label="Mobile navigation">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between border-b py-[clamp(0.75rem,2vh,1rem)] text-base font-medium transition-colors ${active ? `${activeNavBorder} ${activeNavText}` : "border-border/50"}`}
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
                  className={`flex min-h-11 items-center border-b py-3 text-sm font-medium transition-colors ${active ? `${activeNavBorder} ${activeNavText}` : "border-border/50 hover:text-primary"}`}
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
                  className={`flex min-h-11 items-center border-b py-3 text-sm font-medium transition-colors xl:hidden ${active ? "border-primary text-primary" : "border-border/50 hover:text-primary"}`}
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
              className="mt-3 flex min-h-11 items-center py-2 text-sm text-muted-foreground hover:text-primary"
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
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="top"
          className="mx-auto flex h-full max-h-dvh w-full flex-col overflow-hidden p-4 sm:mt-4 sm:h-[90dvh] sm:max-h-[90dvh] sm:max-w-5xl sm:rounded-xl sm:p-6"
        >
          <SheetHeader className="shrink-0 text-center">
            <SheetTitle>Search products</SheetTitle>
            <SheetDescription>
              Find tiles by name, colour, collection, size or SKU.
            </SheetDescription>
          </SheetHeader>
          {searchOpen && <ProductSearchPanel onClose={() => setSearchOpen(false)} />}
        </SheetContent>
      </Sheet>
    </header>
  );
}

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Inbox,
  Mail,
  PackageCheck,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Star,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type AdminAnalytics, type PieSlice, type StatCard } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Formatting ───────────────────────────────────────────────────────────────

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const money = (n: number, currency = "RWF") => `${plain.format(n)} ${currency}`;

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

/** "2026-10-18" → "18 Oct", "2026-10" → "Oct" */
const fmtTick = (label: string) => {
  const isMonth = label.length === 7;
  const d = new Date(`${label}${isMonth ? "-01" : ""}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", isMonth ? { month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });
};

const SLICE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const TONES = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  gray: "border-border bg-muted text-muted-foreground",
};

const toneOf = (status: string): keyof typeof TONES => {
  switch (status) {
    case "PAID":
    case "DELIVERED":
    case "REPLIED":
      return "green";
    case "PENDING":
    case "NEW":
    case "AUTHORIZED":
    case "PROCESSING":
    case "LOW":
      return "amber";
    case "SHIPPED":
    case "READ":
      return "blue";
    case "CANCELLED":
    case "FAILED":
    case "REFUNDED":
    case "OUT_OF_STOCK":
      return "red";
    default:
      return "gray";
  }
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${TONES[toneOf(status)]}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState("30");
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getAdminAnalytics(Number(days)));
    } catch (e) {
      const message = apiErrorMessage(e, "Failed to load dashboard");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Sales, stock and customer activity for your store.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </header>

      {error && !data ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-muted-foreground" />
            <p className="font-medium">Couldn’t load the dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <Dashboard data={data} days={Number(days)} refreshing={loading} />
      )}
    </main>
  );
}

// ─── Dashboard body ───────────────────────────────────────────────────────────

function Dashboard({ data, days, refreshing }: { data: AdminAnalytics; days: number; refreshing: boolean }) {
  const { cards, charts, pies, tables, currency } = data;
  const byKey = (k: string) => cards.find((c) => c.key === k);

  const kpis: [string, LucideIcon][] = [
    ["revenue", Wallet],
    ["orders", ShoppingBag],
    ["avgOrderValue", Receipt],
    ["newCustomers", UserPlus],
  ];

  const attention: { key: string; label: string; href: string; icon: LucideIcon }[] = [
    { key: "ordersToProcess", label: "Orders to process", href: "/admin/orders", icon: PackageCheck },
    { key: "lowStock", label: "Low stock", href: "/admin/inventory", icon: Boxes },
    { key: "outOfStock", label: "Out of stock", href: "/admin/inventory", icon: AlertTriangle },
    { key: "unreadMessages", label: "New messages", href: "/admin/contact", icon: Mail },
    { key: "pendingReviews", label: "Reviews to approve", href: "/admin/reviews", icon: Star },
  ];

  const overview = ["lifetimeRevenue", "totalCustomers", "activeCustomers", "activeProducts", "activeVariants"]
    .map(byKey)
    .filter(Boolean) as StatCard[];

  return (
    <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([key, icon]) => {
          const c = byKey(key);
          return c ? <KpiCard key={key} card={c} icon={icon} currency={currency} days={days} /> : null;
        })}
      </section>

      {/* Needs attention */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {attention.map(({ key, label, href, icon: Icon }) => {
          const value = byKey(key)?.value ?? 0;
          return (
            <Link
              key={key}
              href={href}
              className="group flex items-center gap-3  border bg-card p-3 transition-colors hover:bg-accent"
            >
              <span
                className={`flex size-9 items-center justify-center  ${value > 0 ? TONES.amber : TONES.gray
                  } border`}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-semibold leading-none tabular-nums">{plain.format(value)}</span>
                <span className="block truncate text-xs text-muted-foreground">{label}</span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </section>

      {/* Revenue + sales pies */}
      <section className="grid gap-4 lg:grid-cols-3">
        <RevenueChart daily={charts.revenueDaily} monthly={charts.revenueMonthly} currency={currency} days={days} />
        <PieCard
          title="Sales breakdown"
          description="Share of orders and payments"
          currency={currency}
          sets={[
            { key: "status", label: "Orders", slices: pies.ordersByStatus },
            { key: "fulfillment", label: "Delivery", slices: pies.ordersByFulfillment },
            { key: "method", label: "Payments", slices: pies.paymentsByMethod, money: true },
          ]}
        />
      </section>

      {/* Top products, customers, catalog pies */}
      <section className="grid gap-4 lg:grid-cols-3">
        <TopProductsChart items={charts.topProducts} currency={currency} />
        <CustomersChart items={charts.customersDaily} />
        <PieCard
          title="Catalog"
          description="Revenue, products and stock"
          currency={currency}
          sets={[
            { key: "revenueCat", label: "Revenue", slices: pies.revenueByCategory, money: true },
            { key: "productCat", label: "Products", slices: pies.productsByCategory },
            { key: "stock", label: "Stock", slices: pies.stockHealth },
          ]}
        />
      </section>

      {/* Store overview */}
      {overview.length > 0 && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-y-4 py-5 md:grid-cols-5 md:divide-x">
            {overview.map((c) => (
              <div key={c.key} className="px-4 first:pl-0">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {c.format === "currency" ? money(c.value, currency) : plain.format(c.value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ActivityTable tables={tables} currency={currency} />
        <LowStockCard rows={tables.lowStock} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New messages</CardTitle>
            <CardDescription>Latest contact form enquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {tables.recentMessages.length === 0 && <Empty text="No messages yet" />}
              {tables.recentMessages.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.projectType ?? "General enquiry"} · {m.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-muted-foreground">{fmtDate(m.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews awaiting approval</CardTitle>
            <CardDescription>Customer reviews hidden until approved</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {tables.pendingReviews.length === 0 && <Empty text="No reviews to approve" />}
              {tables.pendingReviews.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title ?? r.product}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.customer} on {r.product}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm tabular-nums">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {r.rating}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  card,
  icon: Icon,
  currency,
  days,
}: {
  card: StatCard;
  icon: LucideIcon;
  currency: string;
  days: number;
}) {
  const value =
    card.format === "currency" ? money(card.value, currency) : card.format === "percent" ? `${card.value}%` : plain.format(card.value);
  const change = card.change;
  const up = (change ?? 0) >= 0;
  const Trend = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <span className="flex size-8 items-center justify-center  bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </span>
        </div>
        <p className="truncate text-2xl font-semibold tabular-nums">{value}</p>
        {change !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
            >
              <Trend className="size-3.5" />
              {Math.abs(change)}%
            </span>
            vs previous {days} days
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

function RevenueChart({
  daily,
  monthly,
  currency,
  days,
}: {
  daily: AdminAnalytics["charts"]["revenueDaily"];
  monthly: AdminAnalytics["charts"]["revenueMonthly"];
  currency: string;
  days: number;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const rows = view === "daily" ? daily : monthly;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Revenue and orders</CardTitle>
          <CardDescription>{view === "daily" ? `Last ${days} days` : "Last 12 months"}</CardDescription>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "monthly")}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueConfig} className="h-[300px] w-full">
          <ComposedChart data={rows} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={fmtTick} />
            <YAxis yAxisId="revenue" tickLine={false} axisLine={false} width={44} tickFormatter={(v) => compact.format(v)} />
            <YAxis yAxisId="orders" orientation="right" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(l) => fmtTick(String(l))}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-6">
                      <span className="text-muted-foreground">{revenueConfig[name as keyof typeof revenueConfig]?.label}</span>
                      <span className="font-medium tabular-nums">
                        {name === "revenue" ? money(Number(value), currency) : plain.format(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area yAxisId="revenue" dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} fill="url(#fillRevenue)" />
            <Line yAxisId="orders" dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const productsConfig = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig;

function TopProductsChart({ items, currency }: { items: AdminAnalytics["charts"]["topProducts"]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best sellers</CardTitle>
        <CardDescription>Top products by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Empty text="No sales in this period" />
        ) : (
          <ChartContainer config={productsConfig} className="h-[260px] w-full">
            <BarChart data={items} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _n, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.payload.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {money(Number(value), currency)} · {plain.format(item.payload.quantity)} m²
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const customersConfig = { customers: { label: "New customers", color: "var(--chart-3)" } } satisfies ChartConfig;

function CustomersChart({ items }: { items: AdminAnalytics["charts"]["customersDaily"] }) {
  const total = items.reduce((s, i) => s + i.customers, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>New customers</CardTitle>
        <CardDescription>{plain.format(total)} sign-ups in this period</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={customersConfig} className="h-[260px] w-full">
          <BarChart data={items} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={fmtTick} />
            <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => fmtTick(String(l))} />} />
            <Bar dataKey="customers" fill="var(--color-customers)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

type PieSet = { key: string; label: string; slices: PieSlice[]; money?: boolean };

function PieCard({
  title,
  description,
  sets,
  currency,
}: {
  title: string;
  description: string;
  sets: PieSet[];
  currency: string;
}) {
  const [active, setActive] = useState(sets[0].key);
  const set = sets.find((s) => s.key === active) ?? sets[0];
  const fmt = (n: number) => (set.money ? money(n, currency) : plain.format(n));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="w-full">
            {sets.map((s) => (
              <TabsTrigger key={s.key} value={s.key} className="flex-1">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {set.slices.length === 0 ? (
          <Empty text="Nothing to show yet" />
        ) : (
          <div className="space-y-4">
            <ChartContainer config={{}} className="mx-auto aspect-square h-[170px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="label"
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-medium tabular-nums">{fmt(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie data={set.slices} dataKey="value" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                  {set.slices.map((_, i) => (
                    <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-1.5 text-sm">
              {set.slices.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 " style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate capitalize">{s.label.toLowerCase()}</span>
                  <span className="tabular-nums text-muted-foreground">{s.percentage}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

function ActivityTable({ tables, currency }: { tables: AdminAnalytics["tables"]; currency: string }) {
  const [tab, setTab] = useState("orders");

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest orders, payments and sign-ups</CardDescription>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {tab === "orders" && (
          <DataTable
            head={["Order", "Customer", "Status", "Payment", "Total", "Date"]}
            empty="No orders yet"
            rows={tables.recentOrders.map((o) => [
              <Link key="n" href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                {o.orderNumber}
              </Link>,
              <div key="c" className="min-w-0">
                <p className="truncate">{o.customer}</p>
                <p className="text-xs text-muted-foreground">{o.items} item(s)</p>
              </div>,
              <StatusBadge key="s" status={o.status} />,
              <StatusBadge key="p" status={o.paymentStatus} />,
              <span key="t" className="tabular-nums">{money(o.total, o.currency || currency)}</span>,
              fmtDate(o.placedAt),
            ])}
          />
        )}
        {tab === "payments" && (
          <DataTable
            head={["Order", "Method", "Status", "Amount", "Date"]}
            empty="No payments yet"
            rows={tables.recentPayments.map((p) => [
              <span key="o" className="font-medium">{p.orderNumber}</span>,
              <span key="m" className="capitalize">{p.method.replace(/_/g, " ").toLowerCase()}</span>,
              <StatusBadge key="s" status={p.status} />,
              <span key="a" className="tabular-nums">{money(p.amount, p.currency || currency)}</span>,
              fmtDate(p.createdAt),
            ])}
          />
        )}
        {tab === "customers" && (
          <DataTable
            head={["Customer", "Phone", "Joined", "Last login"]}
            empty="No customers yet"
            rows={tables.recentCustomers.map((c) => [
              <div key="n" className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>,
              c.phone ?? "—",
              fmtDate(c.joinedAt),
              fmtDate(c.lastLogin),
            ])}
          />
        )}
      </CardContent>
    </Card>
  );
}

function DataTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <Empty text={empty} />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {head.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((cells, i) => (
            <TableRow key={i}>
              {cells.map((cell, j) => (
                <TableCell key={j} className="whitespace-nowrap">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LowStockCard({ rows }: { rows: AdminAnalytics["tables"]["lowStock"] }) {
  const sqm = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Restock list</CardTitle>
        <CardDescription>Variants at or below their reorder level</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty text="Every variant is well stocked" />
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.variantId} className="flex items-center gap-3 py-3">
                <div className="size-10 shrink-0 overflow-hidden  bg-muted">
                  {r.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.product} className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.product}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.size}
                    {r.finish ? ` · ${r.finish}` : ""} · {r.sku}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={r.state} />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {sqm.format(r.availableSqm)} / {sqm.format(r.reorderLevel)} m²
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
      <Inbox className="size-6" />
      {text}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[62px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2" />
        <Skeleton className="h-[400px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[340px]" />
        <Skeleton className="h-[340px]" />
        <Skeleton className="h-[340px]" />
      </div>
    </div>
  );
}
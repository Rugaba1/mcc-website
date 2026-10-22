"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Area,
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
  Heart,
  Inbox,
  Palette,
  Receipt,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type CustomerAnalytics, type PieSlice, type StatCard } from "@/lib/api";

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
const sqm = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = (n: number, currency = "RWF") => `${plain.format(n)} ${currency}`;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtMonth = (label: string) =>
  new Date(`${label}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

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
      return "green";
    case "PENDING":
    case "AUTHORIZED":
    case "PROCESSING":
      return "amber";
    case "SHIPPED":
      return "blue";
    case "CANCELLED":
    case "FAILED":
    case "REFUNDED":
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

export default function CustomerDashboardPage() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getCustomerAnalytics(Number(days)));
    } catch (e) {
      const message = apiErrorMessage(e, "Failed to load your dashboard");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = data?.customer.name.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{firstName ? `Hello, ${firstName}` : "My dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Your orders, spending and saved items in one place.</p>
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
            <p className="font-medium">Couldn’t load your dashboard</p>
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

// ─── Body ─────────────────────────────────────────────────────────────────────

function Dashboard({ data, days, refreshing }: { data: CustomerAnalytics; days: number; refreshing: boolean }) {
  const { cards, charts, pies, tables, currency } = data;
  const byKey = (k: string) => cards.find((c) => c.key === k);

  const kpis: [string, LucideIcon][] = [
    ["totalSpent", Wallet],
    ["periodSpent", Receipt],
    ["periodOrders", ShoppingBag],
    ["activeOrders", Truck],
  ];

  const summary = ["deliveredOrders", "avgOrderValue", "wishlist", "designs", "reviews", "addresses"]
    .map(byKey)
    .filter(Boolean) as StatCard[];

  return (
    <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([key, icon]) => {
          const c = byKey(key);
          return c ? <KpiCard key={key} card={c} icon={icon} currency={currency} days={days} /> : null;
        })}
      </section>

      {/* Orders in progress + cart */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ActiveOrders orders={tables.activeOrders} currency={currency} />
        <CartCard cart={tables.cart} currency={currency} />
      </section>

      {/* Spending + pies */}
      <section className="grid gap-4 lg:grid-cols-3">
        <SpendChart rows={charts.spendMonthly} currency={currency} />
        <PieCard
          sets={[
            { key: "status", label: "Orders", slices: pies.ordersByStatus },
            { key: "method", label: "Payments", slices: pies.spendByPaymentMethod, money: true },
            { key: "category", label: "Categories", slices: pies.spendByCategory, money: true },
          ]}
          currency={currency}
        />
      </section>

      {/* Summary strip */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-y-4 py-5 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {summary.map((c) => (
            <div key={c.key} className="px-4 first:pl-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {c.format === "currency" ? money(c.value, currency) : plain.format(c.value)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* History tables */}
      <HistoryTable tables={tables} currency={currency} />

      {/* Saved */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>Tiles you saved for later</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/wishlist">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tables.wishlist.length === 0 ? (
              <Empty icon={Heart} text="No saved tiles yet" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tables.wishlist.map((w) => (
                  <Link key={w.id} href={`/products/${w.slug ?? w.productId}`} className="group space-y-1.5">
                    <div className="aspect-square overflow-hidden  bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.image} alt={w.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                    <p className="truncate text-sm font-medium">{w.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{w.category}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Room designs</CardTitle>
              <CardDescription>Your saved visualizer projects</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/visualizer">Open visualizer</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tables.designs.length === 0 ? (
              <Empty icon={Palette} text="Try tiles in a room to save your first design" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tables.designs.map((d) => (
                  <Link key={d.id} href={`/visualizer?design=${d.id}`} className="group space-y-1.5">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {d.previewImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.previewImage} alt={d.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                      )}
                    </div>
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.scene ?? "Custom room"} · {d.surfaces} surface{d.surfaces === 1 ? "" : "s"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>My reviews</CardTitle>
          <CardDescription>Reviews appear on the product page once approved</CardDescription>
        </CardHeader>
        <CardContent>
          {tables.recentReviews.length === 0 ? (
            <Empty icon={Star} text="You haven’t reviewed any tiles yet" />
          ) : (
            <ul className="divide-y">
              {tables.recentReviews.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title ?? r.product}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.product} · {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1 text-sm tabular-nums">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                    <Badge variant="outline" className={r.approved ? TONES.green : TONES.amber}>
                      {r.approved ? "Published" : "Awaiting approval"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

function KpiCard({ card, icon: Icon, currency, days }: { card: StatCard; icon: LucideIcon; currency: string; days: number }) {
  const value = card.format === "currency" ? money(card.value, currency) : plain.format(card.value);
  const up = (card.change ?? 0) >= 0;
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
        {card.change !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
            >
              <Trend className="size-3.5" />
              {Math.abs(card.change)}%
            </span>
            vs previous {days} days
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Orders in progress ───────────────────────────────────────────────────────

const STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

function ActiveOrders({ orders, currency }: { orders: CustomerAnalytics["tables"]["activeOrders"]; currency: string }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Orders in progress</CardTitle>
        <CardDescription>Track what’s on its way</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <Empty icon={Truck} text="No active orders right now" />
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const step = Math.max(0, STEPS.indexOf(o.status));
              return (
                <li key={o.id} className="space-y-3  border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/account/orders/${o.id}`} className="font-medium hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Placed {fmtDate(o.placedAt)}
                        {o.estimatedDays ? ` · usually ${o.estimatedDays} days to deliver` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">{money(o.total, currency)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                  <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={step}>
                    {STEPS.map((s, i) => (
                      <span key={s} className={`h-1.5 flex-1  ${i <= step ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  {o.lastUpdate?.note && (
                    <p className="text-xs text-muted-foreground">
                      {o.lastUpdate.note} · {fmtDate(o.lastUpdate.createdAt)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

function CartCard({ cart, currency }: { cart: CustomerAnalytics["tables"]["cart"]; currency: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Your cart</CardTitle>
        <CardDescription>{cart.items.length === 0 ? "Nothing here yet" : `${cart.items.length} item(s) ready to order`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Empty icon={ShoppingCart} text="Your cart is empty" />
            <Button asChild variant="outline">
              <Link href="/products">Browse tiles</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y">
              {cart.items.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="size-12 shrink-0 overflow-hidden  bg-muted">
                    {i.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt={i.product} className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.product}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.size} · {sqm.format(i.coverageSqm)} m²
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">{compact.format(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            {cart.items.length > 4 && (
              <p className="pt-1 text-xs text-muted-foreground">+ {cart.items.length - 4} more in your cart</p>
            )}
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Subtotal{cart.coupon ? ` · code ${cart.coupon.code}` : ""}
                </span>
                <span className="font-semibold tabular-nums">{money(cart.subtotal, currency)}</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/checkout">Go to checkout</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const spendConfig = {
  spent: { label: "Spent", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

function SpendChart({ rows, currency }: { rows: CustomerAnalytics["charts"]["spendMonthly"]; currency: string }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Spending</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={spendConfig} className="h-[280px] w-full">
          <ComposedChart data={rows} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fillSpent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-spent)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-spent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={fmtMonth} />
            <YAxis yAxisId="spent" tickLine={false} axisLine={false} width={44} tickFormatter={(v) => compact.format(v)} />
            <YAxis yAxisId="orders" orientation="right" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(l) =>
                    new Date(`${l}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
                  }
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-6">
                      <span className="text-muted-foreground">{spendConfig[name as keyof typeof spendConfig]?.label}</span>
                      <span className="font-medium tabular-nums">
                        {name === "spent" ? money(Number(value), currency) : plain.format(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area yAxisId="spent" dataKey="spent" type="monotone" stroke="var(--color-spent)" strokeWidth={2} fill="url(#fillSpent)" />
            <Line yAxisId="orders" dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

type PieSet = { key: string; label: string; slices: PieSlice[]; money?: boolean };

function PieCard({ sets, currency }: { sets: PieSet[]; currency: string }) {
  const [active, setActive] = useState(sets[0].key);
  const set = sets.find((s) => s.key === active) ?? sets[0];
  const fmt = (n: number) => (set.money ? money(n, currency) : plain.format(n));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Where it goes</CardTitle>
          <CardDescription>Your orders and spending by type</CardDescription>
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
          <Empty icon={Inbox} text="Nothing to show yet" />
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

// ─── History table ────────────────────────────────────────────────────────────

function HistoryTable({ tables, currency }: { tables: CustomerAnalytics["tables"]; currency: string }) {
  const [tab, setTab] = useState("orders");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>History</CardTitle>
          <CardDescription>Your latest orders and payments</CardDescription>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {tab === "orders" ? (
          <DataTable
            head={["Order", "Items", "Status", "Payment", "Total", "Date"]}
            empty="You haven’t placed any orders yet"
            rows={tables.recentOrders.map((o) => [
              <Link key="n" href={`/account/orders/${o.id}`} className="font-medium hover:underline">
                {o.orderNumber}
              </Link>,
              o.items,
              <StatusBadge key="s" status={o.status} />,
              <StatusBadge key="p" status={o.paymentStatus} />,
              <span key="t" className="tabular-nums">{money(o.total, o.currency || currency)}</span>,
              fmtDate(o.placedAt),
            ])}
          />
        ) : (
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
      </CardContent>
    </Card>
  );
}

function DataTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <Empty icon={Inbox} text={empty} />;
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

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
      <Icon className="size-6" />
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
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] lg:col-span-2" />
        <Skeleton className="h-[320px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[360px] lg:col-span-2" />
        <Skeleton className="h-[360px]" />
      </div>
    </div>
  );
}
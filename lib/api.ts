import { isAxiosError } from "axios";
import {
  toLegalDraftContent,
  type LegalDraftContent,
} from "@/lib/legal/draft-payload";
import apiClient, { refreshAccessToken } from "./api-client";
import { apiServer } from "./api-server";

import { TileProduct } from "@/data/catalog";
import { CollectionItem } from "./generated/prisma/client";
import type { Opt } from "@/lib/locations";
import type { SceneDefinition } from "@/data/scenes";
import type { LegalDocumentType } from "@/lib/legal/constants";
import type { CurrencyOption } from "@/lib/currency";
import type { ReportTable, ReportFormat } from "@/lib/reports/report-data";
import type { PaginatedResult } from "@/lib/server-pagination";

export { refreshAccessToken };

// ─── Types ────────────────────────────────────────────────────────────────────
export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type AdminPageQuery = {
  page: number;
  limit: number;
  q: string;
  filters: Record<string, string>;
};
export type InventoryPageResult = PaginatedResult<InventoryItem> & {
  summary: { variants: number; boxes: number; low: number; out: number };
};
export type Badge = "Bestseller" | "New" | "Premium" | null;
export type Category = "floor" | "wall" | "outdoor" | "special";
export interface MediaFile {
  id: number;
  name: string;
  originalName: string;
  url: string;
  kind: "image" | "file";
  mimeType: string;
  size: number;
  alt: string | null;
  createdAt: string;
}

export interface OrderRequest {
  id: number;
  kind: "CANCEL" | "REFUND";
  status: ContactStatus;
  createdAt: string;
  message: string;
}
export interface AdminVariant extends ProductVariant {
  stockSqm: number;
  reservedSqm: number;
  reorderLevel: number;
}
export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  size: string;
  finish: string | null;
  color: string | null;
  thicknessMm?: number | null;
  shadeCode?: string | null;
  image: string | null;
  textureUrl: string | null;
  active: boolean;
  currency: string;

  // pricing (per m²)
  pricePerSqm: number;
  containerPricePerSqm?: number | null;
  sqmPerContainer?: number | null;
  compareAtPrice?: number | null;

  // stock in m² (present when the API includes inventory)
  inventory?: {
    onHandSqm: number;
    reservedSqm: number;
    reorderLevel: number;
    allowBackorder: boolean;
  } | null;

  /** @deprecated pricing and stock are per m² now */
  piecesPerBox: number;
  /** @deprecated */
  sqmPerBox: number;
  /** @deprecated */
  pricePerBox: number;
  /** @deprecated */
  weightKgPerBox?: number | null;
}

// What the admin variants endpoint returns: inventory flattened for the table
export interface AdminVariant extends ProductVariant {
  stockSqm: number; // Inventory.onHandSqm
  reservedSqm: number; // Inventory.reservedSqm
  reorderLevel: number; // Inventory.reorderLevel
}

export interface VariantInput {
  sku: string;
  size: string;
  finish?: string;
  color?: string;
  shadeCode?: string;
  thicknessMm?: number | null;
  pricePerSqm: number;
  containerPricePerSqm?: number | null;
  sqmPerContainer?: number | null;
  compareAtPrice?: number | null;
  image?: string;
  textureUrl?: string;
  active?: boolean;
  // create only
  stockSqm?: number;
  reorderLevel?: number;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  category: Category;
  categoryLabel: string;
  description: string;
  sizes: string;
  badge: Badge; // must include null, see below
  gradient: string;
  image: string;
  status: ProductStatus;
  colors: string[];
  useCase: string;
  collection: string;

  // tile specs shared by all variants
  material?: string | null;
  origin?: string | null;
  slipRating?: string | null;
  waterAbsorption?: string | null;
  isRectified?: boolean;

  // SEO
  seoTitle?: string | null;
  seoDescription?: string | null;

  featured: boolean;
  variants?: ProductVariant[];
}

export interface ProductWithVariantsAndRelated {
  id: number;
  name: string;
  slug?: string;
  category: Category;
  categoryLabel: string;
  description: string;
  sizes: string;
  badge: Badge;
  gradient: string;
  image: string;
  colors: string[];
  useCase: string;
  collection: string;
  material?: string | null;
  featured: boolean;
  variants?: ProductVariant[];
  collections?: Collection[];
  related?: Product[];
  projects?: Project[];
}
export interface ProductReviewSummary {
  reviews: {
    id: number;
    rating: number;
    title: string | null;
    body: string;
    createdAt: string;
    author: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number | null;
}
export interface TileWithProduct extends TileProduct {
  product: Product;
}

export interface Project {
  id: number;
  title: string;
  type: string;
  description: string;
  gradient: string;
  image: string;
  large: boolean;
  tileIds: number[];
  location: string;
  area: string;
  year: string;
  products?: TileWithProduct[];
}
export interface CollectionItemWithProduct extends CollectionItem {
  product: Product;
}
export interface Collection {
  id: number;
  name: string;
  description: string;
  image: string;
  tileIds: number[];
  featured: boolean;
  items?: CollectionItemWithProduct[];
}

export interface Testimonial {
  id: number;
  text: string;
  name: string;
  role: string;
  initials: string;
}

export interface CatalogueDoc {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  fileUrl: string;
  category: string;
  year: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationDoc {
  id: number;
  slug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  coverImage: string | null;
  fileUrl: string | null;
  placement: "NAVBAR" | "HOME_DIALOG" | "PUBLIC_PAGE" | "NAVBAR_AND_PAGE" | "DIALOG_AND_PAGE";
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export type InvoiceKind = "PROFORMA" | "INVOICE" | "CREDIT_NOTE";

export interface InvoiceRef {
  id: number;
  kind: InvoiceKind;
  number: string;
  issuedAt: string;
  url: string;
}
export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  customerName: string;
  email?: string | null;
  phone?: string | null;
  placedAt: string;
  itemCount: number;
  invoices: InvoiceRef[];
}

export interface OrderDetail extends OrderSummary {
  fulfillment: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  couponCode?: string | null;
  deliveryZone?: string | null;
  customerNote: string | null;
  internalNote: string | null;
  shipFullName: string | null;
  shipPhone: string | null;
  tin: string | null;
  shipProvince?: string | null;
  shipDistrict: string | null;
  shipSector: string | null;
  shipStreet: string | null;
  shipNotes?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  items: {
    id: number;
    productName: string;
    sku: string;
    size: string;
    finish: string | null;
    image: string | null;
    saleType: "SQM" | "CONTAINER";
    quantity: number; // m²
    containers?: number | null;
    unitPrice: number; // per m²
    lineTotal: number;
  }[];
  payments: {
    id: number;
    status: string;
    method: string;
    amount: number;
    currency: string;
    provider?: string | null;
    reference?: string | null;
    paidAt?: string | null;
    createdAt?: string;
  }[];
  history: {
    id: number;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
}

export interface CustomerSummary {
  id: number;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
}

export interface PaymentSummary {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  status: string;
  method: string;
  amount: number;
  currency: string;
  provider: string | null;
  reference: string | null; // providerRef
  payerPhone: string | null;
  failureReason: string | null;
  orderTotal: number;
  refundedAmount: number;
  refundedAt: string | null;
  refundReason: string | null;
  note: string | null;
  proofUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: number; // variant id
  productId: number;
  productName: string;
  sku: string;
  size: string;
  finish: string | null;
  color: string | null;
  stockSqm: number;
  reservedSqm: number;
  lowStockThreshold: number;
}

export interface CustomerDetail extends CustomerSummary {
  profilePicture: string | null;
  isActive: boolean;
  addresses: {
    id: number;
    label: string | null;
    fullName: string;
    phone: string;
    district: string;
    sector: string | null;
    street: string;
  }[];
  orders: OrderDetail[];
}

export type ContactStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";
export type ContactEmailDeliveryType = "ACKNOWLEDGEMENT" | "STAFF_ALERT";
export type ContactEmailDeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED";

export interface ContactEmailDelivery {
  id: number;
  type: ContactEmailDeliveryType;
  status: ContactEmailDeliveryStatus;
  attempts: number;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  lastError: string | null;
}

export interface ContactMessage {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  projectType: string | null;
  message: string;
  status: ContactStatus;
  ackSentAt: string | null;
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
  emailDeliveries: ContactEmailDelivery[];
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  projectType?: string;
  message: string;
  website?: string; // honeypot
}

export interface Profile {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
}

export interface MyOrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  currency: string;
  placedAt: string;
  itemCount: number;
  invoices: InvoiceRef[];
}

export interface MyOrderDetail extends MyOrderSummary {
  fulfillment: string;
  subtotal: number;
  discountTotal: number;
  couponCode?: string | null;
  shippingFee: number;
  taxTotal: number;
  customerNote: string | null;
  shipFullName: string | null;
  shipPhone: string | null;
  tin: string | null;
  shipDistrict: string | null;
  shipSector: string | null;
  shipStreet: string | null;
  items: {
    id: number;
    productName: string;
    sku: string;
    size: string;
    finish: string | null;
    image: string | null;
    saleType: "SQM" | "CONTAINER";
    quantity: number; // m²
    containers?: number | null;
    unitPrice: number; // per m²
    lineTotal: number;
  }[];
  history: {
    id: number;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
  payments: {
    id: number;
    status: string;
    method: string;
    amount: number;
    paidAt: string | null;
  }[];
  invoices: InvoiceRef[];
}

export interface WishlistEntry {
  productId: number;
  name: string;
  image: string;
  categoryLabel: string;
  variant: {
    id: number;
    size: string;
    finish: string | null;
    color: string | null;
    pricePerSqm: number;
    containerPricePerSqm?: number | null;
    sqmPerContainer?: number | null;
  } | null;
}

export interface CheckoutInput {
  items: { variantId: number; saleType: "SQM" | "CONTAINER"; qty: number }[];
  reservationToken?: string;
  shippingId: string;
  fullName: string;
  phone: string;
  tin?: string;
  paymentMethod: string;
  province?: string;
  district?: string;
  sector?: string;
  street?: string;
  note?: string;
  couponCode?: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  description?: string | null;
  type: Coupon["type"];
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
}

export interface CouponValidation {
  code: string;
  type: Coupon["type"];
  value: number;
  subtotal: number;
  discount: number;
  currency: string;
}

export interface ProductReview {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  author: string;
}

export interface ProductReviewData {
  reviews: ProductReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number | null;
  canReview: boolean;
  authenticated: boolean;
  myReview: {
    id: number;
    rating: number;
    approved: boolean;
    title: string | null;
    body: string;
  } | null;
}

export interface LegalAcceptanceState {
  pending: {
    id: number;
    documentType: string;
    version: number;
    title: string;
  }[];
  legalVersionIds: number[];
  acceptedVersionIds: number[];
  accepted: boolean;
}

export interface LegalVersion {
  id: number;
  documentType: LegalDocumentType;
  version: number;
  title: string;
  titleFr: string;
  titleRw: string;
  contentMarkdown: string;
  contentMarkdownFr: string;
  contentMarkdownRw: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface BlockedEmail {
  id: number;
  email: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface BlockableUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface TwoFactorStatus {
  enabled: boolean;
  method: "email" | "authenticator" | null;
  required: boolean;
}

export interface TwoFactorSetup {
  method: "email" | "authenticator";
  challenge: string;
  message: string;
  secret?: string;
  authenticatorUri?: string;
}

export interface AuthLoginResponse {
  success?: boolean;
  emailVerificationRequired?: boolean;
  accountDisabled?: boolean;
  twoFactorRequired?: boolean;
  method?: "email" | "authenticator";
  challenge?: string;
  message?: string;
  accessToken?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    profilePicture: string | null;
    role: { id: number; roleName: string };
    permissions: string[];
  };
}
// ─── Analytics ────────────────────────────────────────────────────────────────

export type CardFormat = "currency" | "number" | "percent";

/** One KPI card. `previous` and `change` (%) exist only on period-compared cards. */
export interface StatCard {
  key: string;
  label: string;
  value: number;
  format: CardFormat;
  previous?: number;
  change?: number;
}
export type ManualMethod =
  | "MTN_MOMO"
  | "AIRTEL_MONEY"
  | "BANK_TRANSFER"
  | "CASH_ON_DELIVERY";
export interface MyPayment {
  id: number;
  method: string;
  status: string;
  amount: number;
  refundedAmount: number;
  refundedAt: string | null;
  refundReason: string | null;
  providerRef: string | null;
  payerPhone: string | null;
  note: string | null;
  failureReason: string | null;
  manual: boolean;
  paidAt: string | null;
  createdAt: string;
}
export interface MyPaymentOrder {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  currency: string;
  placedAt: string;
  paid: number;
  refunded: number;
  balanceDue: number;
  canPay: boolean;
  payments: MyPayment[];
}
export type MyPaymentHistoryEntry = MyPayment & {
  order: Pick<MyPaymentOrder, "id" | "orderNumber" | "currency">;
};
export interface MyPaymentsOverview {
  summary: {
    totalPaid: number;
    outstanding: number;
    pendingCount: number;
    pendingAmount: number;
    refunded: number;
  };
  orders: MyPaymentOrder[];
  history: PaginatedResult<MyPaymentHistoryEntry>;
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
}

interface AnalyticsBase {
  range: { days: number; from: string; to: string };
  generatedAt: string;
  currency: string;
  cards: StatCard[];
}

// ── Admin ──
export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface BlogPostSummary {
  id: number;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: BlogStatus;
  featured: boolean;
  readingMinutes: number;
  publishedAt: string | null;
  updatedAt: string;
  authorName: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  coverAlt: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export type BlogPostInput = Partial<
  Omit<BlogPostDetail, "id" | "updatedAt" | "readingMinutes" | "authorName">
>;

export interface AdminAnalytics extends AnalyticsBase {
  charts: {
    revenueDaily: { label: string; revenue: number; orders: number }[];
    revenueMonthly: { label: string; revenue: number; orders: number }[];
    customersDaily: { label: string; customers: number }[];
    topProducts: { label: string; quantity: number; revenue: number }[];
  };
  pies: {
    ordersByStatus: PieSlice[];
    ordersByFulfillment: PieSlice[];
    paymentsByMethod: PieSlice[];
    paymentsByStatus: PieSlice[];
    revenueByCategory: PieSlice[];
    productsByCategory: PieSlice[];
    stockHealth: PieSlice[];
  };
  tables: {
    recentOrders: {
      id: number;
      orderNumber: string;
      customer: string;
      email: string | null;
      status: string;
      paymentStatus: string;
      fulfillment: string;
      items: number;
      total: number;
      currency: string;
      placedAt: string;
    }[];
    topProducts: {
      rank: number;
      product: string;
      sqmSold: number;
      revenue: number;
    }[];
    lowStock: {
      variantId: number;
      sku: string;
      product: string;
      image: string;
      size: string;
      finish: string | null;
      onHandSqm: number; // was onHandBoxes
      reservedSqm: number; // was reservedBoxes
      availableSqm: number; // was availableBoxes
      reorderLevel: number;
      state: "OUT_OF_STOCK" | "LOW" | "IN_STOCK";
    }[];
    recentCustomers: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      joinedAt: string;
      lastLogin: string | null;
    }[];
    recentPayments: {
      id: number;
      orderNumber: string;
      method: string;
      status: string;
      provider: string | null;
      amount: number;
      currency: string;
      createdAt: string;
    }[];
    recentMessages: {
      id: number;
      name: string;
      email: string;
      projectType: string | null;
      status: ContactStatus;
      createdAt: string;
    }[];
    pendingReviews: {
      id: number;
      product: string;
      customer: string;
      rating: number;
      title: string | null;
      createdAt: string;
    }[];
  };
}

export interface AdminNotification {
  id: number;
  type: "order" | "message" | "review" | "payment";
  title: string;
  message: string | null;
  targetPath: string;
  entityId: number | null;
  createdAt: string;
}

export interface AdminNotificationSummary {
  notifications: AdminNotification[];
  unreadCount: number;
  unreadMessageCount: number;
  latestId: number;
}

// ── Customer ──

export interface CustomerAnalytics extends AnalyticsBase {
  customer: { id: number; name: string; email: string };
  charts: {
    spendMonthly: { label: string; spent: number; orders: number }[];
  };
  pies: {
    ordersByStatus: PieSlice[];
    ordersByFulfillment: PieSlice[];
    spendByPaymentMethod: PieSlice[];
    spendByCategory: PieSlice[];
  };
  tables: {
    activeOrders: {
      id: number;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      fulfillment: string;
      total: number;
      placedAt: string;
      estimatedDays: number | null;
      lastUpdate: {
        status: string;
        note: string | null;
        createdAt: string;
      } | null;
    }[];
    recentOrders: {
      id: number;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      fulfillment: string;
      items: number;
      total: number;
      currency: string;
      placedAt: string;
    }[];
    recentPayments: {
      id: number;
      orderNumber: string;
      method: string;
      status: string;
      amount: number;
      currency: string;
      createdAt: string;
    }[];
    cart: {
      items: {
        id: number;
        product: string;
        image: string | null;
        sku: string;
        size: string;
        finish: string | null;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        coverageSqm: number;
      }[];
      subtotal: number;
      coupon: { code: string; type: "PERCENT" | "FIXED"; value: number } | null;
    };
    wishlist: {
      id: number;
      productId: number;
      name: string;
      slug: string | null;
      image: string;
      category: string;
      addedAt: string;
    }[];
    designs: {
      id: number;
      name: string;
      previewImage: string | null;
      shareToken: string | null;
      scene: string | null;
      roomType: string | null;
      surfaces: number;
      updatedAt: string;
    }[];
    recentReviews: {
      id: number;
      product: string;
      rating: number;
      title: string | null;
      approved: boolean;
      createdAt: string;
    }[];
  };
}

export type AdminUserInput = Partial<{
  name: string;
  email: string;
  password: string;
  active: boolean;
  profilePicture: string | null;
  jobTitle: string | null;
  bio: string | null;
  showOnHomepage: boolean;
  displayOrder: number;
  permissions: string[];
}>;

export interface TeamMember {
  id: number;
  name: string;
  jobTitle: string | null;
  bio: string | null;
  image: string | null;
}
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
  active: boolean;
  profilePicture: string | null;
  jobTitle: string | null;
  bio: string | null;
  showOnHomepage: boolean;
  displayOrder: number;
  permissions: string[];
  createdAt: string;
}
export interface RegularUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  profilePicture: string | null;
  active: boolean;
  permissions: string[];
  emailVerifiedAt: string | null;
  lastLogin: string | null;
  createdAt: string;
}
export interface SavedVisualizerDesign {
  id: number;
  name: string | null;
  shareToken: string | null;
  previewImage: string | null;
  sessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  scene: { name: string; roomType: string } | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
  items: {
    surfaceKey: string;
    rotation: number;
    layout: string | null;
    variant: { sku: string; size: string; product: { name: string } };
  }[];
}
export interface AdminReview {
  id: number;
  productId: number;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  createdAt: string;
  product: { name: string };
  user: { firstName: string; lastName: string | null; email: string };
  author: string;
}
// ─── Request helpers ──────────────────────────────────────────────────────────

type Ok = { ok: boolean };

const get = <T>(url: string) => apiClient.get<T>(url).then((r) => r.data);
const serverGet = <T>(url: string) => apiServer.get<T>(url).then((r) => r.data);
const post = <T>(url: string, body?: unknown) =>
  apiClient.post<T>(url, body).then((r) => r.data);
const patch = <T>(url: string, body?: unknown) =>
  apiClient.patch<T>(url, body).then((r) => r.data);
const put = <T>(url: string, body?: unknown) =>
  apiClient.put<T>(url, body).then((r) => r.data);
const del = <T = Ok>(url: string) =>
  apiClient.delete<T>(url).then((r) => r.data);

/** Builds "?a=1&b=2", skipping undefined, null and empty values. */
const qs = (
  o: Record<string, string | number | boolean | null | undefined>,
) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** Readable message from any error thrown by the api, for toasts. */
export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error ?? data?.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
const getBlob = (url: string) =>
  apiClient.get<Blob>(url, { responseType: "blob" }).then((r) => r.data);
const adminPageQuery = (query: AdminPageQuery) =>
  qs({
    page: query.page,
    limit: query.limit,
    q: query.q,
    ...Object.fromEntries(
      Object.entries(query.filters).filter(([, value]) => value && value !== "all"),
    ),
  });

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  subscribeNewsletter: (data: { email: string; consent: true; website?: string }) =>
    post<{ message: string }>("/api/newsletter", data),
  getAdminNewsletter: () =>
    get<{
      counts: Record<string, number>;
      subscribers: {
        id: number;
        email: string;
        status: string;
        confirmedAt: string | null;
        createdAt: string;
      }[];
      campaigns: {
        id: number;
        subject: string;
        status: string;
        createdAt: string;
        sentAt: string | null;
        recipientCount: number;
        recipientStatusCounts: Record<string, number>;
      }[];
    }>("/api/admin/newsletter"),
  getPublications: () => get<PublicationDoc[]>("/api/publications"),
  getAdminPublications: () => get<PublicationDoc[]>("/api/admin/publications"),
  createPublication: (data: Omit<PublicationDoc, "id" | "slug" | "createdAt" | "updatedAt">) =>
    post<PublicationDoc>("/api/admin/publications", data),
  updatePublication: (
    id: number,
    data: Omit<PublicationDoc, "id" | "slug" | "createdAt" | "updatedAt">,
  ) => put<PublicationDoc>(`/api/admin/publications/${id}`, data),
  deletePublication: (id: number) => del(`/api/admin/publications/${id}`),
  createAdminNewsletterCampaign: (data: { subject: string; bodyMarkdown: string }) =>
    post<{ campaign: { id: number; subject: string; status: string }; recipientCount: number }>(
      "/api/admin/newsletter",
      data,
    ),
  sendAdminNewsletterCampaignBatch: (id: number, retryFailed = false) =>
    post<{
      sent: number;
      failed: number;
      skipped: number;
      pending: number;
      failedTotal: number;
      status: string;
    }>(`/api/admin/newsletter/${id}/send`, { retryFailed }),
  markAdminNotificationsRead: (notificationIds: number[]) =>
    patch<{ markedRead: number }>("/api/admin/notifications", {
      notificationIds,
    }),
  getCurrencies: () =>
    get<{
      baseCurrency: CurrencyOption;
      currencies: CurrencyOption[];
      availableCurrencies: CurrencyOption[];
    }>("/api/currencies"),
  getAdminCurrencies: () =>
    get<{ currencies: CurrencyOption[] }>("/api/admin/currencies"),
  createCurrency: (currency: Omit<CurrencyOption, "enabled" | "isBase">) =>
    post<{ currency: CurrencyOption }>("/api/admin/currencies", currency),
  updateCurrency: (currency: Partial<CurrencyOption> & { code: string }) =>
    patch<{ currency: CurrencyOption }>("/api/admin/currencies", currency),
  // Auth and legal
  getCurrentLegalDocuments: () =>
    get<{
      documents: { id: number; slug: string; title: string; version: number }[];
    }>("/api/legal/current"),
  getLegalAcceptance: () => get<LegalAcceptanceState>("/api/legal/acceptance"),
  acceptLegalDocuments: (legalVersionIds: number[]) =>
    post<{ accepted: boolean }>("/api/legal/acceptance", { legalVersionIds }),
  getAdminLegalVersions: () =>
    get<{ versions: LegalVersion[] }>("/api/admin/legal"),
  createLegalDraft: (
    draft: Pick<
      LegalVersion,
      | "documentType"
      | "title"
      | "titleFr"
      | "titleRw"
      | "contentMarkdown"
      | "contentMarkdownFr"
      | "contentMarkdownRw"
    >,
  ) => post<{ version: LegalVersion }>("/api/admin/legal", draft),
  updateLegalDraft: (
    id: number,
    draft: LegalDraftContent & { documentType?: unknown },
  ) => put<LegalVersion>(`/api/admin/legal/${id}`, toLegalDraftContent(draft)),
  publishLegalVersion: (id: number) =>
    post<{ version: LegalVersion }>(`/api/admin/legal/${id}/publish`),
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    password: string;
    acceptedLegalVersionIds: number[];
    next?: string;
  }) => post<unknown>("/api/auth/register", data),
  authenticate: (data: {
    identifier: string;
    password: string;
    next: string;
    challenge?: string;
    code?: string;
  }) =>
    post<AuthLoginResponse>("/api/auth/login", data),
  logout: () => post<Ok>("/api/auth/logout"),
  resendVerification: (data: { email: string; next?: string }) =>
    post<{ message: string }>("/api/auth/resend-verification", data),
  verifyEmail: (token: string) =>
    post<{ message: string }>("/api/auth/verify-email", { token }),
  requestPasswordReset: (email: string) =>
    post<{ message: string }>("/api/auth/forgot-password", { email }),
  resetPassword: (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => post<Ok>("/api/auth/reset-password", data),
  getTwoFactorStatus: () => get<TwoFactorStatus>("/api/auth/two-factor"),
  setupTwoFactor: (data: {
    method: TwoFactorSetup["method"];
    currentPassword: string;
  }) => post<TwoFactorSetup>("/api/auth/two-factor/setup", data),
  confirmTwoFactor: (data: {
    method: TwoFactorSetup["method"];
    challenge: string;
    code: string;
  }) => post<TwoFactorStatus>("/api/auth/two-factor/confirm", data),
  disableTwoFactor: (currentPassword: string) =>
    apiClient
      .delete<Ok>("/api/auth/two-factor", { data: { currentPassword } })
      .then((r) => r.data),

  // Public data
  getProvinces: (signal?: AbortSignal) =>
    apiClient.get<Opt[]>("/api/locations/provinces", { signal }).then((r) => r.data),
  getDistricts: (province: string, signal?: AbortSignal) =>
    apiClient
      .get<Opt[]>(`/api/locations/districts${qs({ province })}`, { signal })
      .then((r) => r.data),
  getSectors: (province: string, district: string, signal?: AbortSignal) =>
    apiClient
      .get<Opt[]>(`/api/locations/sectors${qs({ province, district })}`, { signal })
      .then((r) => r.data),
  getVisualizerProducts: () =>
    get<{ products: Product[]; total: number }>("/api/visualizer-products").then(
      (result) => result.products,
    ),
  getVisualizerScenes: () => get<SceneDefinition[]>("/api/visualizer/scenes"),
  getProductReviews: (productId: number, page: number, signal?: AbortSignal) =>
    apiClient
      .get<ProductReviewData>(
        `/api/products/${productId}/reviews${qs({ page })}`,
        { signal },
      )
      .then((r) => r.data),
  submitProductReview: (
    productId: number,
    data: { rating: number; title: string; body: string },
  ) => post<{ message: string }>(`/api/products/${productId}/reviews`, data),
  getBlockedEmails: () => get<BlockedEmail[]>("/api/admin/blocked-emails"),
  searchBlockableUsers: (query: string) =>
    get<{ users: BlockableUser[] }>(
      `/api/admin/blocked-emails/users${qs({ query })}`,
    ),
  createBlockedEmail: (data: {
    userId?: number;
    email?: string;
    reason: string;
  }) =>
    post<{ entry: BlockedEmail; disabledAccounts: number }>(
      "/api/admin/blocked-emails",
      data,
    ),
  deactivateBlockedEmail: (id: number) =>
    apiClient
      .patch<BlockedEmail>(`/api/admin/blocked-emails/${id}`, {
        isActive: false,
      })
      .then((r) => r.data),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post<{ url: string }>("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      })
      .then((r) => r.data.url);
  },
  getManagedUsers: () =>
    get<{
      id: number;
      name: string;
      email: string;
      role: string;
      active: boolean;
      canProducts: boolean;
      canCollections: boolean;
      canProjects: boolean;
      canTestimonials: boolean;
      canUsers: boolean;
    }[]>("/api/users"),
  createManagedUser: (data: Record<string, unknown>) =>
    post<unknown>("/api/users", data),
  updateManagedUser: (id: number, data: Record<string, unknown>) =>
    put<unknown>(`/api/users/${id}`, data),
  deleteManagedUser: (id: number) => del(`/api/users/${id}`),

  // Blog
  getAdminBlogPosts: (p: {
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    get<{ posts: BlogPostSummary[]; total: number; totalPages: number }>(
      `/api/admin/blog${qs(p)}`,
    ),
  getPublicBlogPosts: (p: { locale?: string; limit?: number; search?: string } = {}) =>
    get<{ posts: BlogPostSummary[]; total: number; totalPages: number }>(
      `/api/blog${qs(p)}`,
    ),
  getAdminBlogPost: (id: number) =>
    get<BlogPostDetail>(`/api/admin/blog/${id}`),
  createBlogPost: (d: BlogPostInput) =>
    post<BlogPostDetail>("/api/admin/blog", d),
  updateBlogPost: (id: number, d: BlogPostInput) =>
    put<BlogPostDetail>(`/api/admin/blog/${id}`, d),
  deleteBlogPost: (id: number) => del(`/api/admin/blog/${id}`),
  getAdminOrder: (id: number) => get<OrderDetail>(`/api/admin/orders/${id}`),

  updateOrderStatus: (
    id: number,
    status: string,
    note?: string,
    paidAt?: string,
  ) =>
    apiClient
      .patch<Ok>(`/api/admin/orders/${id}`, { status, note, paidAt })
      .then((r) => r.data),
  updatePayment: (
    id: number,
    d: {
      status?: string;
      providerRef?: string | null;
      payerPhone?: string | null;
      note?: string | null;
      proofUrl?: string | null;
      failureReason?: string | null;
      paidAt?: string;
    },
  ) =>
    put<{ id: number; status: string; orderPaymentStatus?: string }>(
      `/api/payments/${id}`,
      d,
    ),
  refundPayment: (id: number, d: { amount: number; reason: string }) =>
    post<{ ok: boolean }>(`/api/payments/${id}/refund`, d),
  recordPayment: (
    orderId: number,
    d: {
      method: string;
      status: string;
      amount: number;
      providerRef?: string;
      payerPhone?: string;
      note?: string;
      proofUrl?: string;
      paidAt?: string;
    },
  ) => post<{ id: number }>(`/api/orders/${orderId}/payments`, d),

  getMyPayments: (page = 1, limit = 8) =>
    get<MyPaymentsOverview>(`/api/me/payments${qs({ page, limit })}`),
  payMyOrder: (
    orderId: number,
    d: {
      method: ManualMethod;
      amount?: number;
      payerPhone?: string;
      providerRef?: string;
      note?: string;
    },
  ) => post<{ id: number }>(`/api/me/orders/${orderId}/payments`, d),
  updateMyPayment: (
    id: number,
    d: { providerRef?: string; payerPhone?: string },
  ) => apiClient.patch<Ok>(`/api/me/payments/${id}`, d).then((r) => r.data),
  withdrawMyPayment: (id: number) => del(`/api/me/payments/${id}`),
  getInvoicePdf: (url: string) => getBlob(url),
  getMediaPdf: (url: string) => getBlob(url),
  getUsers: () => get<RegularUser[]>("/api/users?type=regular"),
  createUser: (d: {
    name: string;
    email: string;
    password: string;
    active: boolean;
    emailVerified?: boolean;
    permissions?: string[];
    phoneNumber?: string | null;
    profilePicture?: string | null;
  }) => post<RegularUser>("/api/users", { ...d, accountType: "regular" }),
  updateUser: (
    id: number,
    d: Partial<{
      name: string;
      email: string;
      password: string;
      active: boolean;
      emailVerified: boolean;
      permissions: string[];
      phoneNumber: string | null;
      profilePicture: string | null;
    }>,
  ) => put<RegularUser>(`/api/users/${id}`, { ...d, accountType: "regular" }),
  deleteUser: (id: number) => del(`/api/users/${id}?type=regular`),
  getStaff: () => get<AdminUser[]>("/api/users?type=staff"),
  createStaff: (
    d: AdminUserInput & { name: string; email: string; password: string },
  ) => post<AdminUser>("/api/users", { ...d, accountType: "staff" }),
  updateStaff: (id: number, d: AdminUserInput) =>
    put<AdminUser>(`/api/users/${id}`, { ...d, accountType: "staff" }),
  deleteStaff: (id: number) => del(`/api/users/${id}?type=staff`),
  createVisualizerDesign: (d: {
    sceneId: number | null;
    name: string;
    sessionId?: string;
    previewImage?: string | null;
    items: {
      variantId: number;
      surfaceKey: string;
      groutColor: string | null;
      rotation: number;
      layout: string | null;
    }[];
  }) =>
    post<{
      success: boolean;
      designId: number;
      shareToken: string;
      shareUrl: string;
    }>("/api/visualizer/designs", d),
  updateVisualizerDesign: (d: {
    shareToken: string;
    sceneId: number | null;
    name: string;
    sessionId?: string;
    previewImage?: string | null;
    items: {
      variantId: number;
      surfaceKey: string;
      groutColor: string | null;
      rotation: number;
      layout: string | null;
    }[];
  }) =>
    put<{
      success: boolean;
      designId: number;
      shareToken: string;
      shareUrl: string;
    }>("/api/visualizer/designs", d),
  getVisualizerDesign: (token: string) =>
    get<any>(`/api/visualizer/designs?token=${encodeURIComponent(token)}`),
  getMyVisualizerDesigns: () =>
    get<SavedVisualizerDesign[]>("/api/me/visualizer/designs"),
  deleteMyVisualizerDesign: (id: number) =>
    del(`/api/me/visualizer/designs?id=${id}`),
  getAdminVisualizerDesignsPage: (page: number, limit: number, q: string) =>
    get<PaginatedResult<SavedVisualizerDesign>>(
      `/api/admin/visualizer/designs${qs({ page, limit, q })}`,
    ),
  deleteAdminVisualizerDesign: (id: number) =>
    del(`/api/admin/visualizer/designs?id=${id}`),
  getAdminReviews: (page: number, status: "pending" | "approved" | "all") =>
    get<{
      reviews: AdminReview[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/api/admin/reviews${qs({ page, status })}`),
  moderateReview: (id: number, approved: boolean) =>
    apiClient
      .patch<{
        id: number;
        approved: boolean;
      }>("/api/admin/reviews", { id, approved })
      .then((r) => r.data),
  deleteReview: (id: number) => del(`/api/admin/reviews?id=${id}`),
  getFiles: (p: { q?: string; kind?: string; page?: number; limit?: number }) =>
    get<{ files: MediaFile[]; total: number; totalPages: number }>(
      `/api/files${qs(p)}`,
    ),
  uploadFiles: (files: File[], onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("file", f));
    return apiClient
      .post<{ files: MediaFile[] }>("/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
      .then((r) => r.data.files);
  },
  renameFile: (id: number, d: { name?: string; alt?: string | null }) =>
    apiClient.patch<MediaFile>(`/api/files/${id}`, d).then((r) => r.data),
  deleteFile: (id: number) => del(`/api/files/${id}`),
  getVariants: (productId: number) =>
    get<AdminVariant[]>(`/api/products/${productId}/variants`),
  createVariant: (productId: number, d: VariantInput) =>
    post<AdminVariant>(`/api/products/${productId}/variants`, d),
  updateVariant: (id: number, d: VariantInput) =>
    put<AdminVariant>(`/api/variants/${id}`, d),
  deleteVariant: (id: number) => del(`/api/variants/${id}`),
  getProducts: ({
    search,
    skip = 0,
    limit = 12,
    status,
    category,
    type,
    badge,
    sort,
  }: {
    search?: string;
    page?: number;
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    type?: string;
    badge?: string;
    sort?: "name" | "category" | "newest";
  } = {}) => {
    const p = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) p.set("query", search);
    if (status) p.set("status", status);
    if (category) p.set("category", category);
    if (type) p.set("type", type);
    if (badge) p.set("badge", badge);
    if (sort) p.set("sort", sort);
    return get<{
      products: Product[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/products?${p}`);
  },
  // Analytics
  getAdminAnalytics: (days = 30) =>
    get<{ data: AdminAnalytics }>(`/api/admin/analytics?days=${days}`).then(
      (r) => r.data,
    ),
  getCustomerAnalytics: (days = 30) =>
    get<{ data: CustomerAnalytics }>(
      `/api/customer/analytics?days=${days}`,
    ).then((r) => r.data),
  createProduct: (d: Omit<Product, "id">) => post<Product>("/api/products", d),
  updateProduct: (id: number, d: Omit<Product, "id">) =>
    put<Product>(`/api/products/${id}`, d),
  deleteProduct: (id: number) => del(`/api/products/${id}`),

  // Collections
  getCollections: () => get<Collection[]>("/api/collections"),
  getCollectionsPage: (query: AdminPageQuery) =>
    get<PaginatedResult<Collection>>(`/api/collections${adminPageQuery(query)}`),
  createCollection: (d: Omit<Collection, "id">) =>
    post<Collection>("/api/collections", d),
  updateCollection: (id: number, d: Omit<Collection, "id">) =>
    put<Collection>(`/api/collections/${id}`, d),
  deleteCollection: (id: number) => del(`/api/collections/${id}`),

  // Projects
  getProjects: () => get<Project[]>("/api/projects"),
  getProjectsPage: (query: AdminPageQuery) =>
    get<PaginatedResult<Project>>(`/api/projects${adminPageQuery(query)}`),
  createProject: (d: Omit<Project, "id">) => post<Project>("/api/projects", d),
  updateProject: (id: number, d: Omit<Project, "id">) =>
    put<Project>(`/api/projects/${id}`, d),
  deleteProject: (id: number) => del(`/api/projects/${id}`),

  // Testimonials
  getTestimonials: () => get<Testimonial[]>("/api/testimonials"),
  getTestimonialsPage: (query: AdminPageQuery) =>
    get<PaginatedResult<Testimonial>>(`/api/testimonials${adminPageQuery(query)}`),
  createTestimonial: (d: Omit<Testimonial, "id">) =>
    post<Testimonial>("/api/testimonials", d),
  updateTestimonial: (id: number, d: Omit<Testimonial, "id">) =>
    put<Testimonial>(`/api/testimonials/${id}`, d),
  deleteTestimonial: (id: number) => del(`/api/testimonials/${id}`),

  // Catalogues
  getCatalogues: () => get<CatalogueDoc[]>("/api/catalogues"),
  getAdminCataloguesPage: (query: AdminPageQuery) =>
    get<PaginatedResult<CatalogueDoc>>(
      `/api/admin/catalogues${adminPageQuery(query)}`,
    ),
  createCatalogue: (d: Omit<CatalogueDoc, "id" | "createdAt" | "updatedAt">) =>
    post<CatalogueDoc>("/api/catalogues", d),
  updateCatalogue: (
    id: number,
    d: Partial<Omit<CatalogueDoc, "id" | "createdAt" | "updatedAt">>,
  ) => put<CatalogueDoc>(`/api/catalogues/${id}`, d),
  deleteCatalogue: (id: number) => del(`/api/catalogues/${id}`),

  // Orders
  getOrders: () => get<OrderSummary[]>("/api/orders"),
  getOrdersPage: (query: AdminPageQuery) =>
    get<PaginatedResult<OrderSummary>>(`/api/orders${adminPageQuery(query)}`),
  getUnpaidOrdersPage: (page: number, limit: number, q: string) =>
    get<PaginatedResult<OrderSummary>>(
      `/api/orders${qs({ page, limit, q, unpaid: 1 })}`,
    ),
  getOrder: (id: number) => get<OrderDetail>(`/api/orders/${id}`),
  updateOrder: (
    id: number,
    data: Partial<{
      status: string;
      internalNote: string | null;
      paidAt: string;
    }>,
  ) =>
    put<{ id: number; status: string; internalNote: string | null }>(
      `/api/orders/${id}`,
      data,
    ),

  // Customers
  getCustomers: () => get<CustomerSummary[]>("/api/customers"),
  getCustomersPage: (query: AdminPageQuery) =>
    get<PaginatedResult<CustomerSummary>>(`/api/customers${adminPageQuery(query)}`),
  getCustomer: (id: number) => get<CustomerDetail>(`/api/customers/${id}`),
  // Payments
  getPayments: () => get<PaymentSummary[]>("/api/payments"),
  getPaymentsPage: (query: AdminPageQuery) =>
    get<PaginatedResult<PaymentSummary>>(`/api/payments${adminPageQuery(query)}`),

  // Inventory
  getInventory: () => get<InventoryItem[]>("/api/inventory"),
  getInventoryPage: (query: {
    page: number;
    limit: number;
    q: string;
    state: "all" | "ok" | "low" | "out";
    sort: string;
  }) =>
    get<InventoryPageResult>(
      `/api/inventory${qs(query)}`,
    ),
  getAdminFinancialReport: (from: string, to: string) =>
    get<ReportTable>(`/api/admin/reports/financial${qs({ from, to })}`),
  getAdminInventoryReport: () =>
    get<ReportTable>("/api/admin/reports/inventory"),
  downloadAdminReport: (
    report: "financial" | "inventory",
    format: ReportFormat,
    dateRange?: { from: string; to: string },
  ) =>
    getBlob(
      `/api/admin/reports/${report}/export${qs({ format, ...dateRange })}`,
    ),
  updateStock: (
    variantId: number,
    d: { stockSqm: number; lowStockThreshold: number },
  ) => put<InventoryItem>(`/api/inventory/${variantId}`, d),
  // Visualizer textures
  updateVariantTexture: (variantId: number, textureUrl: string | null) =>
    put<{ id: number; textureUrl: string | null }>(
      `/api/variants/${variantId}`,
      {
        textureUrl,
      },
    ),
  // Contact
  sendContact: (d: ContactInput) =>
    post<{
      success: boolean;
      confirmationSent: boolean;
      staffAlertSent: boolean;
    }>(
      "/api/contact",
      d,
    ),
  getContactMessages: () => get<ContactMessage[]>("/api/contact-messages"),
  getContactMessagesPage: (query: AdminPageQuery) =>
    get<PaginatedResult<ContactMessage>>(`/api/contact-messages${adminPageQuery(query)}`),
  retryContactEmail: (id: number, type: ContactEmailDeliveryType) =>
    post<ContactEmailDelivery>(`/api/contact-messages/${id}/email-retry`, { type }),
  updateContactStatus: (id: number, status: ContactStatus) =>
    put<{ id: number; status: ContactStatus }>(`/api/contact-messages/${id}`, {
      status,
    }),
  replyContact: (id: number, reply: string) =>
    post<{ id: number; status: ContactStatus }>(
      `/api/contact-messages/${id}/reply`,
      { reply },
    ),
  deleteContactMessage: (id: number) => del(`/api/contact-messages/${id}`),
  // Customer
  getMe: () => get<Profile>("/api/auth/me"),
  updateMe: (d: {
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
  }) => put<Profile>("/api/auth/me", d),
  changePassword: (d: { currentPassword: string; newPassword: string }) =>
    post<Ok>("/api/auth/change-password", d),
  getMyOrders: () => get<MyOrderSummary[]>("/api/me/orders"),
  getMyOrdersPage: (page = 1, limit = 10) =>
    get<PaginatedResult<MyOrderSummary>>(`/api/me/orders${qs({ page, limit })}`),
  getMyOrderRequests: (id: number) =>
    get<OrderRequest[]>(`/api/me/orders/${id}/requests`),
  createMyOrderRequest: (
    id: number,
    body: { kind: OrderRequest["kind"]; reason: string },
  ) => post<OrderRequest>(`/api/me/orders/${id}/requests`, body),
  getMyOrder: (id: number) => get<MyOrderDetail>(`/api/me/orders/${id}`),
  getWishlist: () => get<WishlistEntry[]>("/api/wishlist"),
  addToWishlist: (productId: number) =>
    post<Ok>("/api/wishlist", { productId }),
  removeFromWishlist: (productId: number) => del(`/api/wishlist/${productId}`),
  checkout: (d: CheckoutInput) =>
    post<{ id: number; orderNumber: string }>("/api/checkout", d),
  reserveCheckoutStock: (data: {
    items: CheckoutInput["items"];
    reservationToken?: string;
  }) =>
    post<{ reservationToken: string; expiresAt: string }>(
      "/api/checkout/reservation",
      data,
    ),
  validateCoupon: (body: {
    code: string;
    items: CheckoutInput["items"];
  }) => post<CouponValidation>("/api/coupons/validate", body),
  getAdminCoupons: () =>
    get<{ coupons: Coupon[] }>("/api/admin/coupons"),
  createCoupon: (coupon: CouponInput) =>
    post<{ coupon: Coupon }>("/api/admin/coupons", coupon),
  updateCoupon: (id: number, coupon: Partial<CouponInput>) =>
    patch<{ coupon: Coupon }>(`/api/admin/coupons/${id}`, coupon),
  deleteMyAccount: (password: string) =>
    apiClient
      .delete<Ok>("/api/me/account", { data: { password } })
      .then((r) => r.data),
};

export const serverApi = {
  getSitemapTests: async (baseUrl: string | undefined) => {
    if (!baseUrl) return [];
    const response = await apiServer.get<
      | { id: string | number; devotional_date: string | null }[]
      | { items?: { id: string | number; devotional_date: string | null }[] }
    >(`${baseUrl}/tests?limit=100`);
    const data = response.data;
    return Array.isArray(data) ? data : data.items ?? [];
  },
  getTeam: () => serverGet<TeamMember[]>("/api/team"),
  // Products
  getProducts: ({
    search,
    skip,
    limit,
    status,
    category,
    type,
    featured,
    badge,
    sort,
  }: {
    search?: string;
    page?: number;
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    type?: string;
    featured?: boolean;
    badge?: string;
    sort?: "name" | "category" | "newest";
  }) =>
    serverGet<{ products: Product[]; total: number; totalPages: number }>(
      `/api/products?${new URLSearchParams(
        Object.entries({
          skip: String(skip ?? 0),
          limit: String(limit ?? 12),
          query: search,
          status,
          category,
          type,
          featured: featured === undefined ? undefined : String(featured),
          badge,
          sort,
        }).filter((entry): entry is [string, string] => entry[1] !== undefined),
      )}`,
    ),
  getProductsNumber: () => serverGet<number>("/api/products/count"),
  getProduct: (id: string) =>
    serverGet<ProductWithVariantsAndRelated>(`/api/products/${id}`),
  getProductReviews: (id: string) =>
    serverGet<ProductReviewSummary>(`/api/products/${id}/reviews?page=1`),

  // Collections
  getCollections: () => serverGet<Collection[]>("/api/collections"),

  // Projects
  getProjects: ({
    activeType,
    selectedProject,
  }: {
    activeType?: string;
    selectedProject?: string;
  }) =>
    serverGet<Project[]>(
      `/api/projects?activeType=${activeType}&selectedProject=${selectedProject}`,
    ),

  // Testimonials
  getTestimonials: () => serverGet<Testimonial[]>("/api/testimonials"),

  // Catalogues
  getCatalogues: () => serverGet<CatalogueDoc[]>("/api/catalogues"),

  // Inventory
  getInventory: () => serverGet<InventoryItem[]>("/api/inventory"),
};
// ─── Category / Badge helpers (used by admin) ─────────────────────────────────

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "floor", label: "Floor Tiles" },
  { value: "wall", label: "Wall Tiles" },
  { value: "outdoor", label: "Outdoor Tiles" },
  { value: "special", label: "Special Finish" },
];

export const BADGE_OPTIONS: { value: Badge; label: string }[] = [
  { value: null, label: "None" },
  { value: "Bestseller", label: "Bestseller" },
  { value: "New", label: "New" },
  { value: "Premium", label: "Premium" },
];

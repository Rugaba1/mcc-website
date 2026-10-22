import { isAxiosError } from "axios";
import apiClient from "./api-client";
import { apiServer } from "./api-server";

import { TileProduct } from "@/data/catalog";
import { CollectionItem } from "./generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
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
  orders: OrderDetail[];
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
  reorderLevel: number; // was lowStockThreshold
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
  shippingFee: number;
  taxTotal: number;
  customerNote: string | null;
  shipFullName: string | null;
  shipPhone: string | null;
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
  quantity: number;          // m²
  containers?: number | null;
  unitPrice: number;         // per m²
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
  shippingId: string;
  fullName: string;
  phone: string;
  paymentMethod: string;
  province?: string;
  district?: string;
  sector?: string;
  street?: string;
  note?: string;
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
export interface MyPaymentsOverview {
  summary: {
    totalPaid: number;
    outstanding: number;
    pendingCount: number;
    pendingAmount: number;
    refunded: number;
  };
  orders: MyPaymentOrder[];
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
// ─── Request helpers ──────────────────────────────────────────────────────────

type Ok = { ok: boolean };

const get = <T>(url: string) => apiClient.get<T>(url).then((r) => r.data);
const serverGet = <T>(url: string) => apiServer.get<T>(url).then((r) => r.data);
const post = <T>(url: string, body?: unknown) =>
  apiClient.post<T>(url, body).then((r) => r.data);
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

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
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
  getAdminBlogPost: (id: number) =>
    get<BlogPostDetail>(`/api/admin/blog/${id}`),
  createBlogPost: (d: BlogPostInput) =>
    post<BlogPostDetail>("/api/admin/blog", d),
  updateBlogPost: (id: number, d: BlogPostInput) =>
    put<BlogPostDetail>(`/api/admin/blog/${id}`, d),
  deleteBlogPost: (id: number) => del(`/api/admin/blog/${id}`),
  getAdminOrder: (id: number) => get<OrderDetail>(`/api/admin/orders/${id}`),

  updateOrderStatus: (id: number, status: string, note?: string) =>
    apiClient
      .patch<Ok>(`/api/admin/orders/${id}`, { status, note })
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
    },
  ) => post<{ id: number }>(`/api/orders/${orderId}/payments`, d),

  getMyPayments: () => get<MyPaymentsOverview>("/api/me/payments"),
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
  getUsers: () => get<AdminUser[]>("/api/users"),
  createUser: (
    d: AdminUserInput & { name: string; email: string; password: string },
  ) => post<AdminUser>("/api/users", d),
  updateUser: (id: number, d: AdminUserInput) =>
    put<AdminUser>(`/api/users/${id}`, d),
  deleteUser: (id: number) => del(`/api/users/${id}`),
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
  }: {
    search?: string;
    page?: number;
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    type?: string;
  }) => {
    const p = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) p.set("query", search);
    if (status) p.set("status", status);
    if (category) p.set("category", category);
    if (type) p.set("type", type);
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
  createCollection: (d: Omit<Collection, "id">) =>
    post<Collection>("/api/collections", d),
  updateCollection: (id: number, d: Omit<Collection, "id">) =>
    put<Collection>(`/api/collections/${id}`, d),
  deleteCollection: (id: number) => del(`/api/collections/${id}`),

  // Projects
  getProjects: () => get<Project[]>("/api/projects"),
  createProject: (d: Omit<Project, "id">) => post<Project>("/api/projects", d),
  updateProject: (id: number, d: Omit<Project, "id">) =>
    put<Project>(`/api/projects/${id}`, d),
  deleteProject: (id: number) => del(`/api/projects/${id}`),

  // Testimonials
  getTestimonials: () => get<Testimonial[]>("/api/testimonials"),
  createTestimonial: (d: Omit<Testimonial, "id">) =>
    post<Testimonial>("/api/testimonials", d),
  updateTestimonial: (id: number, d: Omit<Testimonial, "id">) =>
    put<Testimonial>(`/api/testimonials/${id}`, d),
  deleteTestimonial: (id: number) => del(`/api/testimonials/${id}`),

  // Catalogues
  getCatalogues: () => get<CatalogueDoc[]>("/api/catalogues"),
  createCatalogue: (d: Omit<CatalogueDoc, "id" | "createdAt" | "updatedAt">) =>
    post<CatalogueDoc>("/api/catalogues", d),
  updateCatalogue: (
    id: number,
    d: Partial<Omit<CatalogueDoc, "id" | "createdAt" | "updatedAt">>,
  ) => put<CatalogueDoc>(`/api/catalogues/${id}`, d),
  deleteCatalogue: (id: number) => del(`/api/catalogues/${id}`),

  // Orders
  getOrders: () => get<OrderSummary[]>("/api/orders"),
  getOrder: (id: number) => get<OrderDetail>(`/api/orders/${id}`),
  updateOrder: (
    id: number,
    data: Partial<{ status: string; internalNote: string | null }>,
  ) =>
    put<{ id: number; status: string; internalNote: string | null }>(
      `/api/orders/${id}`,
      data,
    ),

  // Customers
  getCustomers: () => get<CustomerSummary[]>("/api/customers"),
  getCustomer: (id: number) => get<CustomerDetail>(`/api/customers/${id}`),
  // Payments
  getPayments: () => get<PaymentSummary[]>("/api/payments"),

  // Inventory
  getInventory: () => get<InventoryItem[]>("/api/inventory"),
  updateStock: (
    variantId: number,
    d: { stockSqm: number; reorderLevel: number },
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
    post<{ success: boolean }>("/api/contact", d),
  getContactMessages: () => get<ContactMessage[]>("/api/contact-messages"),
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
  getMyOrder: (id: number) => get<MyOrderDetail>(`/api/me/orders/${id}`),
  getWishlist: () => get<WishlistEntry[]>("/api/wishlist"),
  addToWishlist: (productId: number) =>
    post<Ok>("/api/wishlist", { productId }),
  removeFromWishlist: (productId: number) => del(`/api/wishlist/${productId}`),
  checkout: (d: CheckoutInput) =>
    post<{ id: number; orderNumber: string }>("/api/checkout", d),
  deleteMyAccount: (password: string) =>
    apiClient
      .delete<Ok>("/api/me/account", { data: { password } })
      .then((r) => r.data),
};

export const serverApi = {
  getTeam: () => serverGet<TeamMember[]>("/api/team"),
  // Products
  getProducts: ({
    search,
    skip,
    limit,
    status,
    category,
    type,
  }: {
    search?: string;
    page?: number;
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    type?: string;
  }) =>
    serverGet<{ products: Product[]; totalPages: number }>(
      `/api/products?skip=${skip}&query=${search}&limit=${limit}&status=${status}&category=${category}&type=${type}`,
    ),
  getProductsNumber: () => serverGet<number>("/api/products/count"),
  getProduct: (id: string) =>
    serverGet<ProductWithVariantsAndRelated>(`/api/products/${id}`),

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

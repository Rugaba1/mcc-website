/**
 * Client-side API helper.
 * Every call goes through the shared axios client, so requests carry the
 * Bearer token, refresh on 401, and send the Accept-Language header.
 *
 * Browser only: apiClient reads window and the in-memory token store.
 * Use plain fetch or Prisma directly in server components.
 */

import { isAxiosError } from "axios";
import apiClient from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Badge = "Bestseller" | "New" | "Premium" | null;
export type Category = "floor" | "wall" | "outdoor" | "special";

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  size: string;
  finish: string | null;
  color: string | null;
  thicknessMm?: number | null;
  shadeCode?: string | null;
  piecesPerBox: number;
  sqmPerBox: number;
  weightKgPerBox?: number | null;
  pricePerSqm: number;
  pricePerBox: number;
  compareAtPrice?: number | null;
  currency: string;
  image: string | null;
  textureUrl: string | null;
  active: boolean;
}

export interface Product {
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
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  image: string;
  tileIds: number[];
  featured: boolean;
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
}

export interface OrderDetail extends OrderSummary {
  fulfillment: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  customerNote: string | null;
  internalNote: string | null;
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
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  payments: {
    id: number;
    status: string;
    method: string;
    amount: number;
    currency: string;
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
  stockBoxes: number;
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
  id: number; firstName: string; lastName: string | null; email: string;
  phoneNumber: string | null; createdAt: string;
}

export interface MyOrderSummary {
  id: number; orderNumber: string; status: string; paymentStatus: string;
  grandTotal: number; currency: string; placedAt: string; itemCount: number;
}

export interface MyOrderDetail extends MyOrderSummary {
  fulfillment: string; subtotal: number; discountTotal: number; shippingFee: number; taxTotal: number;
  customerNote: string | null;
  shipFullName: string | null; shipPhone: string | null;
  shipDistrict: string | null; shipSector: string | null; shipStreet: string | null;
  items: {
    id: number; productName: string; sku: string; size: string; finish: string | null;
    image: string | null; quantity: number; sqmPerBox: number; unitPrice: number; lineTotal: number;
  }[];
  history: { id: number; status: string; note: string | null; createdAt: string }[];
  payments: { id: number; status: string; method: string; amount: number; paidAt: string | null }[];
}

export interface WishlistEntry {
  productId: number; name: string; image: string; categoryLabel: string;
  variant: { id: number; size: string; color: string | null; finish: string | null; sqmPerBox: number; pricePerBox: number } | null;
}

export interface CheckoutInput {
  items: { variantId: number; qty: number }[];
  shippingId: string;
  fullName: string; phone: string;
  district?: string; sector?: string; street?: string; note?: string;
}

// ─── Request helpers ──────────────────────────────────────────────────────────

type Ok = { ok: boolean };

const get = <T>(url: string) => apiClient.get<T>(url).then((r) => r.data);
const post = <T>(url: string, body?: unknown) =>
  apiClient.post<T>(url, body).then((r) => r.data);
const put = <T>(url: string, body?: unknown) =>
  apiClient.put<T>(url, body).then((r) => r.data);
const del = <T = Ok>(url: string) =>
  apiClient.delete<T>(url).then((r) => r.data);

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

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  // Products
  getProducts: () => get<Product[]>("/api/products"),
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
    d: { stockBoxes: number; lowStockThreshold: number },
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
  sendContact: (d: ContactInput) => post<{ success: boolean }>("/api/contact", d),
  getContactMessages: () => get<ContactMessage[]>("/api/contact-messages"),
  updateContactStatus: (id: number, status: ContactStatus) =>
    put<{ id: number; status: ContactStatus }>(`/api/contact-messages/${id}`, { status }),
  replyContact: (id: number, reply: string) =>
    post<{ id: number; status: ContactStatus }>(`/api/contact-messages/${id}/reply`, { reply }),
  deleteContactMessage: (id: number) => del(`/api/contact-messages/${id}`),
    // Customer
  getMe: () => get<Profile>("/api/me"),
  updateMe: (d: { firstName: string; lastName?: string; phoneNumber?: string }) => put<Profile>("/api/me", d),
  changePassword: (d: { currentPassword: string; newPassword: string }) => post<Ok>("/api/me/password", d),
  getMyOrders: () => get<MyOrderSummary[]>("/api/me/orders"),
  getMyOrder: (id: number) => get<MyOrderDetail>(`/api/me/orders/${id}`),
  getWishlist: () => get<WishlistEntry[]>("/api/wishlist"),
  addToWishlist: (productId: number) => post<Ok>("/api/wishlist", { productId }),
  removeFromWishlist: (productId: number) => del(`/api/wishlist/${productId}`),
  checkout: (d: CheckoutInput) => post<{ id: number; orderNumber: string }>("/api/checkout", d),
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

/**
 * Client-side API helper.
 * All pages use these functions — they call the Next.js API routes
 * which talk to the SQLite database via Prisma.
 *
 * Usage:
 *   const products = await api.getProducts();
 *   await api.createProduct(data);
 *   await api.updateProduct(id, data);
 *   await api.deleteProduct(id);
 */

// ─── Types (mirror store.ts for backwards compat) ─────────────────────────────

export type Badge    = "Bestseller" | "New" | "Premium" | null;
export type Category = "floor" | "wall" | "outdoor" | "special";

export interface Product {
  id:            number;
  name:          string;
  category:      Category;
  categoryLabel: string;
  description:   string;
  sizes:         string;
  badge:         Badge;
  gradient:      string;
  image:         string;
  colors:        string[];
  useCase:       string;
  collection:    string;
  featured:      boolean;
}

export interface Project {
  id:          number;
  title:       string;
  type:        string;
  description: string;
  gradient:    string;
  image:       string;
  large:       boolean;
  tileIds:     number[];
  location:    string;
  area:        string;
  year:        string;
}

export interface Collection {
  id:          number;
  name:        string;
  description: string;
  image:       string;
  tileIds:     number[];
  featured:    boolean;
}

export interface Testimonial {
  id:       number;
  text:     string;
  name:     string;
  role:     string;
  initials: string;
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const api = {
  // Products
  getProducts:    ()              => req<Product[]>("/api/products"),
  createProduct:  (d: Omit<Product, "id">) =>
    req<Product>("/api/products", { method: "POST", body: JSON.stringify(d) }),
  updateProduct:  (id: number, d: Omit<Product, "id">) =>
    req<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteProduct:  (id: number) =>
    req<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),

  // Collections
  getCollections:   ()                         => req<Collection[]>("/api/collections"),
  createCollection: (d: Omit<Collection, "id">) =>
    req<Collection>("/api/collections", { method: "POST", body: JSON.stringify(d) }),
  updateCollection: (id: number, d: Omit<Collection, "id">) =>
    req<Collection>(`/api/collections/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteCollection: (id: number) =>
    req<{ ok: boolean }>(`/api/collections/${id}`, { method: "DELETE" }),

  // Projects
  getProjects:   ()                        => req<Project[]>("/api/projects"),
  createProject: (d: Omit<Project, "id">) =>
    req<Project>("/api/projects", { method: "POST", body: JSON.stringify(d) }),
  updateProject: (id: number, d: Omit<Project, "id">) =>
    req<Project>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteProject: (id: number) =>
    req<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),

  // Testimonials
  getTestimonials:   ()                           => req<Testimonial[]>("/api/testimonials"),
  createTestimonial: (d: Omit<Testimonial, "id">) =>
    req<Testimonial>("/api/testimonials", { method: "POST", body: JSON.stringify(d) }),
  updateTestimonial: (id: number, d: Omit<Testimonial, "id">) =>
    req<Testimonial>(`/api/testimonials/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteTestimonial: (id: number) =>
    req<{ ok: boolean }>(`/api/testimonials/${id}`, { method: "DELETE" }),
};

// ─── Category / Badge helpers (used by admin) ─────────────────────────────────

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "floor",   label: "Floor Tiles" },
  { value: "wall",    label: "Wall Tiles" },
  { value: "outdoor", label: "Outdoor Tiles" },
  { value: "special", label: "Special Finish" },
];

export const BADGE_OPTIONS: { value: Badge; label: string }[] = [
  { value: null,         label: "None" },
  { value: "Bestseller", label: "Bestseller" },
  { value: "New",        label: "New" },
  { value: "Premium",    label: "Premium" },
];

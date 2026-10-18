/**
 * Client-side data store.
 * Admin writes to localStorage; public pages read from it, falling back to
 * the static data.ts defaults when nothing has been saved yet.
 */

import {
  products as defaultProducts,
  projects as defaultProjects,
  testimonials as defaultTestimonials,
} from "./data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Badge = "Bestseller" | "New" | "Premium" | null;
export type Category = "floor" | "wall" | "outdoor" | "special";

export interface Product {
  id: number;
  name: string;
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
  featured: boolean;
}

export interface Project {
  id: number;
  title: string;
  type: string;
  description: string;
  gradient: string;
  image: string;
  large: boolean;
  tileIds: number[];   // product IDs used in this project
  location: string;    // e.g. "Kigali, Rwanda"
  area: string;        // e.g. "12,000 m²"
  year: string;        // e.g. "2023"
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  image: string;
  tileIds: number[];   // product IDs in this collection
  featured: boolean;
}

export interface Testimonial {
  id: number;
  text: string;
  name: string;
  role: string;
  initials: string;
}

// ─── Default collections ──────────────────────────────────────────────────────

export const defaultCollections: Collection[] = [
  {
    id: 1,
    name: "Terrain Series",
    description:
      "Natural earth-tone finishes inspired by rocky landscapes. Ideal for living spaces, corridors and outdoor areas.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    tileIds: [1, 4],
    featured: true,
  },
  {
    id: 2,
    name: "Azure Collection",
    description:
      "Cool blues and clean whites — subway-style and metro tiles for kitchens, bathrooms, and feature walls.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80",
    tileIds: [2],
    featured: false,
  },
  {
    id: 3,
    name: "Onyx Prestige",
    description:
      "Dark, dramatic surfaces with authentic marble veining. For spaces that demand a premium statement.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
    tileIds: [3],
    featured: true,
  },
  {
    id: 4,
    name: "Gold & Ivory Classics",
    description:
      "Timeless warmth. Metallic glazes and travertine effects that bring elegance to any interior.",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80",
    tileIds: [5, 6],
    featured: false,
  },
];

// ─── Default projects (migrate to include new fields) ─────────────────────────

export const defaultProjectsExtended: Project[] = [
  {
    id: 1,
    title: "Kigali Convention Centre Hotel",
    type: "Hospitality",
    description:
      "Supplied over 12,000 m² of premium floor and wall tiles for the iconic convention centre hotel complex.",
    gradient: "from-[#1a3a2a] to-[#2d6a4f]",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
    large: true,
    tileIds: [3, 5],
    location: "Kigali, Rwanda",
    area: "12,000 m²",
    year: "2022",
  },
  {
    id: 2,
    title: "Vision City Mall",
    type: "Commercial",
    description:
      "8,500 m² of large-format porcelain tiles for Rwanda's premier shopping destination.",
    gradient: "from-[#2c3e70] to-[#4a6fa5]",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80",
    large: false,
    tileIds: [1, 3],
    location: "Kigali, Rwanda",
    area: "8,500 m²",
    year: "2021",
  },
  {
    id: 3,
    title: "Kimihurura Luxury Villas",
    type: "Residential",
    description:
      "Custom-designed tiles for 40+ premium villas in Kigali's most prestigious neighbourhood.",
    gradient: "from-[#5a3e1b] to-[#8b6330]",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    large: false,
    tileIds: [6, 5],
    location: "Kimihurura, Kigali",
    area: "4,200 m²",
    year: "2023",
  },
  {
    id: 4,
    title: "Kigali International Airport",
    type: "Infrastructure",
    description:
      "Heavy-duty floor tiles for Rwanda's flagship international gateway — durable, elegant, and easy to maintain.",
    gradient: "from-[#1a2a3a] to-[#2d4a6a]",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    large: false,
    tileIds: [1, 4],
    location: "Kanombe, Kigali",
    area: "22,000 m²",
    year: "2020",
  },
  {
    id: 5,
    title: "King Faisal Hospital Expansion",
    type: "Healthcare",
    description:
      "Antibacterial, easy-clean tiles for clinical areas and patient wards across the hospital expansion.",
    gradient: "from-[#3a1a2a] to-[#6a2d4a]",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    large: false,
    tileIds: [2, 6],
    location: "Kacyiru, Kigali",
    area: "3,800 m²",
    year: "2023",
  },
];

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  products:     "mcc_products",
  projects:     "mcc_projects",
  testimonials: "mcc_testimonials",
  collections:  "mcc_collections",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function migrateProduct(p: Partial<Product> & { id: number }): Product {
  return {
    useCase: "",
    collection: "",
    featured: false,
    colors: [],
    badge: null,
    gradient: "from-[#c8b89a] to-[#a0896e]",
    ...p,
  } as Product;
}

function migrateProject(p: Partial<Project> & { id: number }): Project {
  return {
    tileIds: [],
    location: "Kigali, Rwanda",
    area: "",
    year: "",
    large: false,
    gradient: "from-[#1a3a2a] to-[#2d6a4f]",
    ...p,
  } as Project;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const store = {
  // Products
  getProducts(): Product[] {
    const raw = load<Partial<Product> & { id: number }>(
      KEYS.products,
      defaultProducts as unknown as (Partial<Product> & { id: number })[]
    );
    return raw.map(migrateProduct);
  },
  saveProducts(data: Product[]): void {
    save(KEYS.products, data);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mcc-store-update"));
  },

  // Projects
  getProjects(): Project[] {
    const raw = load<Partial<Project> & { id: number }>(
      KEYS.projects,
      defaultProjectsExtended as unknown as (Partial<Project> & { id: number })[]
    );
    return raw.map(migrateProject);
  },
  saveProjects(data: Project[]): void {
    save(KEYS.projects, data);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mcc-store-update"));
  },

  // Collections
  getCollections(): Collection[] {
    return load<Collection>(KEYS.collections, defaultCollections);
  },
  saveCollections(data: Collection[]): void {
    save(KEYS.collections, data);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mcc-store-update"));
  },

  // Testimonials
  getTestimonials(): Testimonial[] {
    return load<Testimonial>(KEYS.testimonials, defaultTestimonials);
  },
  saveTestimonials(data: Testimonial[]): void {
    save(KEYS.testimonials, data);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mcc-store-update"));
  },

  // Reset
  reset(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mcc-store-update"));
  },
};

// ─── Category helpers ─────────────────────────────────────────────────────────

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

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/app/i18n/routing";
import { clampQty, useCart } from "@/contexts/cart-context";
import type { CartItem } from "@/contexts/cart-context";
import { api, type ContactInput } from "@/lib/api";
import { MIN_SQM, type SaleType } from "@/lib/sale-pricing";

type JsonRecord = Record<string, unknown>;

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, JsonRecord>;
    required: string[];
    additionalProperties: false;
  };
  execute: (
    input: unknown,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
};

type WebMcpContext = {
  registerTool(
    tool: WebMcpTool,
    options: { signal: AbortSignal },
  ): void | Promise<void>;
};

type ApiVariant = {
  id: number;
  size: string;
  finish: string | null;
  color: string | null;
  currency: string;
  pricePerSqm: number;
  containerPricePerSqm: number | null;
  sqmPerContainer: number | null;
  availability: string;
};

type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  category: string;
  status: string;
  variants: ApiVariant[];
};

const pagePaths = {
  home: "/",
  products: "/products",
  collections: "/collections",
  catalogues: "/catalogue",
  projects: "/projects",
  blog: "/blog",
  publications: "/publications",
  visualizer: "/visualizer",
  about: "/about",
  "why-us": "/why-us",
  contact: "/contact",
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
  account: "/account",
} as const;

type StorePage = keyof typeof pagePaths;

const PRODUCT_SCHEMA = {
  type: "object" as const,
  properties: {
    query: {
      type: "string",
      description: "Tile name, category, color, size, or use case.",
      minLength: 2,
      maxLength: 100,
    },
    limit: {
      type: "integer",
      description: "Maximum results to return, from 1 to 10.",
      minimum: 1,
      maximum: 10,
    },
  },
  required: ["query"],
  additionalProperties: false,
};

declare global {
  interface Document {
    modelContext?: WebMcpContext;
  }

  interface Navigator {
    modelContext?: WebMcpContext;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  input: JsonRecord,
  key: string,
  minLength = 1,
  maxLength = 200,
): string {
  const value = input[key];
  if (typeof value !== "string") {
    throw new TypeError(`${key} must be a string.`);
  }
  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new RangeError(`${key} must contain ${minLength}-${maxLength} characters.`);
  }
  return normalized;
}

function requiredInteger(input: JsonRecord, key: string): number {
  const value = input[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${key} must be a positive integer.`);
  }
  return value;
}

function requiredQuantity(input: JsonRecord, saleType: SaleType): number {
  const value = input.quantity;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError("quantity must be a positive number.");
  }
  if (saleType === "SQM" && value < MIN_SQM) {
    throw new RangeError(`The minimum quantity is ${MIN_SQM} m².`);
  }
  if (clampQty(saleType, value) !== value) {
    throw new RangeError(
      saleType === "CONTAINER"
        ? "Container quantity must be a whole number from 1 to 999."
        : "Area quantity must be from 1 to 100000 m², in increments of 0.01.",
    );
  }
  return value;
}

function saleTypeFrom(input: JsonRecord): SaleType {
  const saleType = input.saleType ?? "SQM";
  if (saleType !== "SQM" && saleType !== "CONTAINER") {
    throw new TypeError("saleType must be SQM or CONTAINER.");
  }
  return saleType;
}

function parseVariant(value: unknown): ApiVariant | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "number" ||
    typeof value.size !== "string" ||
    typeof value.pricePerSqm !== "number" ||
    typeof value.currency !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    size: value.size,
    finish: typeof value.finish === "string" ? value.finish : null,
    color: typeof value.color === "string" ? value.color : null,
    currency: value.currency,
    pricePerSqm: value.pricePerSqm,
    containerPricePerSqm:
      typeof value.containerPricePerSqm === "number"
        ? value.containerPricePerSqm
        : null,
    sqmPerContainer:
      typeof value.sqmPerContainer === "number" ? value.sqmPerContainer : null,
    availability:
      typeof value.availability === "string"
        ? value.availability
        : "https://schema.org/OutOfStock",
  };
}

function parseProduct(value: unknown): ApiProduct {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    value.status !== "ACTIVE" ||
    !Array.isArray(value.variants)
  ) {
    throw new Error("The product response was missing public product data.");
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    description: typeof value.description === "string" ? value.description : "",
    image: typeof value.image === "string" ? value.image : "",
    category: typeof value.category === "string" ? value.category : "",
    status: value.status,
    variants: value.variants
      .map(parseVariant)
      .filter((variant): variant is ApiVariant => variant !== null),
  };
}

function publicProduct(product: ApiProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    image: product.image,
    category: product.category,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      finish: variant.finish,
      color: variant.color,
      currency: variant.currency,
      pricePerSqm: variant.pricePerSqm,
      containerPricePerSqm: variant.containerPricePerSqm,
      sqmPerContainer: variant.sqmPerContainer,
      availability: variant.availability,
    })),
  };
}

async function fetchProduct(identifier: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/products/${encodeURIComponent(identifier)}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(`Product lookup failed with HTTP ${response.status}.`);
  }
  return parseProduct(await response.json());
}

function parseProductList(value: unknown): ApiProduct[] {
  if (!isRecord(value) || !Array.isArray(value.products)) {
    throw new Error("Product search returned an invalid response.");
  }
  return value.products.map(parseProduct);
}

function tool(
  name: string,
  description: string,
  properties: Record<string, JsonRecord>,
  required: string[],
  execute: WebMcpTool["execute"],
): WebMcpTool {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
    execute,
  };
}

export default function WebMcpTools() {
  const cart = useCart();
  const router = useRouter();
  const cartRef = useRef(cart);
  const routerRef = useRef(router);
  cartRef.current = cart;
  routerRef.current = router;

  useEffect(() => {
    const context = document.modelContext ?? navigator.modelContext;
    if (!context) return;

    const controller = new AbortController();
    const tools: WebMcpTool[] = [
      tool(
        "search_mcc_products",
        "Search Mountain Ceramics Company's active public tile catalogue. This tool only reads product information.",
        PRODUCT_SCHEMA.properties,
        ["query"],
        async (input, options) => {
          if (!isRecord(input)) throw new TypeError("Search input must be an object.");
          const query = requiredString(input, "query", 2, 100);
          const rawLimit = input.limit ?? 5;
          if (
            typeof rawLimit !== "number" ||
            !Number.isInteger(rawLimit) ||
            rawLimit < 1 ||
            rawLimit > 10
          ) {
            throw new RangeError("limit must be an integer from 1 to 10.");
          }
          const params = new URLSearchParams({
            search: query,
            limit: String(rawLimit),
            status: "ACTIVE",
          });
          const response = await fetch(`/api/products?${params}`, {
            headers: { Accept: "application/json" },
            signal: options?.signal ?? controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Product search failed with HTTP ${response.status}.`);
          }
          const payload: unknown = await response.json();
          const products = parseProductList(payload);
          return {
            products: products.map(publicProduct),
            total:
              isRecord(payload) && typeof payload.total === "number"
                ? payload.total
                : products.length,
          };
        },
      ),
      tool(
        "get_mcc_product",
        "Get current public details, variant prices, and availability for an active product by ID or slug.",
        { identifier: { type: "string", description: "Product ID or stable slug." } },
        ["identifier"],
        async (input, options) => {
          if (!isRecord(input)) throw new TypeError("Product input must be an object.");
          const identifier = requiredString(input, "identifier", 1, 120);
          return publicProduct(
            await fetchProduct(identifier, options?.signal ?? controller.signal),
          );
        },
      ),
      tool(
        "list_mcc_collections",
        "Browse public tile collections.",
        {},
        [],
        async (_input, options) => {
          const response = await fetch("/api/collections", {
            headers: { Accept: "application/json" },
            signal: options?.signal ?? controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Collection lookup failed with HTTP ${response.status}.`);
          }
          const result: unknown = await response.json();
          if (!Array.isArray(result)) {
            throw new Error("Collection lookup returned an invalid response.");
          }
          return result.map((item) => {
            if (!isRecord(item)) return null;
            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              image: item.image,
              productCount: Array.isArray(item.items) ? item.items.length : 0,
            };
          }).filter(Boolean);
        },
      ),
      tool(
        "list_mcc_catalogues",
        "Browse published tile catalogues and their download links.",
        {},
        [],
        async (_input, options) => {
          const response = await fetch("/api/catalogues", {
            headers: { Accept: "application/json" },
            signal: options?.signal ?? controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Catalogue lookup failed with HTTP ${response.status}.`);
          }
          const result: unknown = await response.json();
          if (!Array.isArray(result)) {
            throw new Error("Catalogue lookup returned an invalid response.");
          }
          return result
            .filter(isRecord)
            .map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              category: item.category,
              year: item.year,
              fileUrl: item.fileUrl,
            }));
        },
      ),
      tool(
        "open_mcc_page",
        "Navigate to a public store page, cart, checkout, account, or login page. Checkout navigation does not submit an order.",
        {
          page: {
            type: "string",
            enum: Object.keys(pagePaths),
            description: "The store page to open.",
          },
        },
        ["page"],
        async (input) => {
          if (!isRecord(input) || typeof input.page !== "string") {
            throw new TypeError("page must be a supported store page.");
          }
          if (!Object.hasOwn(pagePaths, input.page)) {
            throw new RangeError("That store page is not supported.");
          }
          const page = input.page as StorePage;
          if (page === "checkout" && cartRef.current.items.length === 0) {
            throw new Error("Add at least one product to the cart first.");
          }
          routerRef.current.push(pagePaths[page]);
          return {
            opened: page,
            note:
              page === "checkout"
                ? "Review the order total, shipping details, and payment method yourself before submitting."
                : "Page opened in the current browser session.",
          };
        },
      ),
      tool(
        "open_mcc_product_page",
        "Open an active product's localized product page.",
        { slug: { type: "string", description: "Stable product slug." } },
        ["slug"],
        async (input, options) => {
          if (!isRecord(input)) throw new TypeError("Product input must be an object.");
          const slug = requiredString(input, "slug", 1, 120);
          const product = await fetchProduct(slug, options?.signal ?? controller.signal);
          routerRef.current.push(`/products/${encodeURIComponent(product.slug)}`);
          return { opened: "product", product: publicProduct(product) };
        },
      ),
      tool(
        "view_mcc_cart",
        "Read the current browser cart. Cart prices are estimates; the server recalculates the order total at checkout.",
        {},
        [],
        async () => {
          const current = cartRef.current;
          if (!current.ready) throw new Error("The cart is still loading.");
          return {
            itemCount: current.items.length,
            items: current.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              size: item.size,
              finish: item.finish,
              color: item.color,
              saleType: item.saleType,
              quantity: item.qty,
              currency: item.currency,
            })),
            note: "The server recalculates prices and availability at checkout.",
          };
        },
      ),
      tool(
        "add_mcc_product_to_cart",
        "Add an active public product variant to the current browser cart. This does not place an order or start payment.",
        {
          product: { type: "string", description: "Product ID or stable slug." },
          variantId: { type: "integer", description: "Variant ID from current product details." },
          saleType: {
            type: "string",
            enum: ["SQM", "CONTAINER"],
            description: "Purchase unit; CONTAINER is allowed only when offered for this variant.",
          },
          quantity: { type: "number", description: "Square metres or whole container count." },
        },
        ["product", "variantId", "quantity"],
        async (input, options) => {
          if (!isRecord(input)) throw new TypeError("Cart input must be an object.");
          const current = cartRef.current;
          if (!current.ready) throw new Error("The cart is still loading.");
          const identifier = requiredString(input, "product", 1, 120);
          const variantId = requiredInteger(input, "variantId");
          const saleType = saleTypeFrom(input);
          const quantity = requiredQuantity(input, saleType);
          const product = await fetchProduct(
            identifier,
            options?.signal ?? controller.signal,
          );
          const variant = product.variants.find((item) => item.id === variantId);
          if (!variant) throw new Error("That active variant was not found on the product.");
          if (variant.availability === "https://schema.org/OutOfStock") {
            throw new Error("That variant is currently out of stock.");
          }
          if (
            saleType === "CONTAINER" &&
            (!variant.containerPricePerSqm || !variant.sqmPerContainer)
          ) {
            throw new Error("That variant is not currently sold by container.");
          }
          if (variant.pricePerSqm <= 0) {
            throw new Error("That variant does not have a current price.");
          }
          const item: Omit<CartItem, "qty"> = {
            variantId: variant.id,
            productId: product.id,
            name: product.name,
            image: product.image,
            size: variant.size,
            finish: variant.finish,
            color: variant.color,
            currency: variant.currency,
            saleType,
            pricePerSqm: variant.pricePerSqm,
            containerPricePerSqm: variant.containerPricePerSqm,
            sqmPerContainer: variant.sqmPerContainer,
          };
          current.addToCart(item, quantity);
          return {
            added: true,
            product: product.name,
            size: variant.size,
            saleType,
            quantity,
            note: "Added to cart only. No order has been placed; prices and stock are rechecked at checkout.",
          };
        },
      ),
      tool(
        "update_mcc_cart_quantity",
        "Change the quantity of a variant already in the current browser cart.",
        {
          variantId: { type: "integer", description: "Variant ID." },
          saleType: { type: "string", enum: ["SQM", "CONTAINER"] },
          quantity: { type: "number", description: "Square metres or whole container count." },
        },
        ["variantId", "saleType", "quantity"],
        async (input) => {
          if (!isRecord(input)) throw new TypeError("Cart input must be an object.");
          const current = cartRef.current;
          if (!current.ready) throw new Error("The cart is still loading.");
          const variantId = requiredInteger(input, "variantId");
          const saleType = saleTypeFrom(input);
          const quantity = requiredQuantity(input, saleType);
          if (!current.items.some((item) => item.variantId === variantId && item.saleType === saleType)) {
            throw new Error("That variant is not in the cart.");
          }
          current.setQty(variantId, saleType, quantity);
          return { updated: true, variantId, saleType, quantity };
        },
      ),
      tool(
        "remove_mcc_cart_item",
        "Remove one product variant from the current browser cart.",
        {
          variantId: { type: "integer", description: "Variant ID." },
          saleType: { type: "string", enum: ["SQM", "CONTAINER"] },
        },
        ["variantId", "saleType"],
        async (input) => {
          if (!isRecord(input)) throw new TypeError("Cart input must be an object.");
          const current = cartRef.current;
          if (!current.ready) throw new Error("The cart is still loading.");
          const variantId = requiredInteger(input, "variantId");
          const saleType = saleTypeFrom(input);
          if (!current.items.some((item) => item.variantId === variantId && item.saleType === saleType)) {
            throw new Error("That variant is not in the cart.");
          }
          current.removeFromCart(variantId, saleType);
          return { removed: true, variantId, saleType };
        },
      ),
      tool(
        "send_mcc_contact_message",
        "Send a contact message only after the user has asked to send it and confirms the exact message in the browser confirmation dialog.",
        {
          firstName: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
          email: { type: "string", format: "email", maxLength: 254 },
          phone: { type: "string", maxLength: 20 },
          projectType: {
            type: "string",
            enum: ["Residential", "Commercial", "Industrial", "Infrastructure", "Other"],
          },
          message: { type: "string", minLength: 10, maxLength: 5000 },
        },
        ["firstName", "lastName", "email", "message"],
        async (input, options) => {
          if (!isRecord(input)) throw new TypeError("Contact details must be an object.");
          const data: ContactInput = {
            firstName: requiredString(input, "firstName", 1, 80),
            lastName: requiredString(input, "lastName", 1, 80),
            email: requiredString(input, "email", 3, 254),
            phone: typeof input.phone === "string" ? input.phone.trim() : undefined,
            projectType:
              typeof input.projectType === "string"
                ? requiredString(input, "projectType", 1, 30)
                : undefined,
            message: requiredString(input, "message", 10, 5000),
          };
          const confirmed = window.confirm(
            `Send this message to Mountain Ceramics Company?\n\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone || "Not provided"}\nProject: ${data.projectType || "Not specified"}\n\nMessage:\n${data.message}`,
          );
          if (!confirmed) return { sent: false, cancelled: true };
          if (options?.signal?.aborted) throw new DOMException("Request was cancelled.", "AbortError");
          const result = await api.sendContact(data);
          return {
            sent: result.success,
            confirmationSent: result.confirmationSent,
            staffAlertSent: result.staffAlertSent,
          };
        },
      ),
    ];

    for (const registeredTool of tools) {
      void Promise.resolve(
        context.registerTool(registeredTool, { signal: controller.signal }),
      ).catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(`Could not register WebMCP tool ${registeredTool.name}:`, error);
        }
      });
    }

    return () => controller.abort();
  }, []);

  return null;
}

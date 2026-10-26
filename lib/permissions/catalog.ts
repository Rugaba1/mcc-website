 
export const ADMIN_CODE = "admin" as const;
export const CUSTOMER_PERM = {
  REVIEWS_CREATE: "customer.reviews.create",
} as const;
export const DEFAULT_REGULAR_PERMISSIONS = [CUSTOMER_PERM.REVIEWS_CREATE];
export const PERM = {
  // Full access
  ADMIN: "admin",

  // Catalog
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_PUBLISH: "products.publish",
  PRODUCTS_DELETE: "products.delete",
  VARIANTS_MANAGE: "variants.manage",
  PRICING_MANAGE: "pricing.manage",
  CATEGORIES_MANAGE: "categories.manage",
  COLLECTIONS_MANAGE: "collections.manage",
  PRODUCTS_MANAGE: "products.manage",

  // Inventory
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_ADJUST: "inventory.adjust",
  INVENTORY_SETTINGS: "inventory.settings",
  INVENTORY_MANAGE: "inventory.manage",

  // Promotions & delivery
  COUPONS_VIEW: "coupons.view",
  COUPONS_MANAGE: "coupons.manage",
  DELIVERY_VIEW: "delivery.view",
  DELIVERY_MANAGE: "delivery.manage",

  // Orders
  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE_STATUS: "orders.update_status",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_NOTE: "orders.note",
  ORDERS_EXPORT: "orders.export",
  INVOICES_VIEW: "invoices.view",
  INVOICES_ISSUE: "invoices.issue",
  ORDERS_MANAGE: "orders.manage",

  // Payments
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_RECORD: "payments.record",
  PAYMENTS_REFUND: "payments.refund",
  PAYMENTS_MANAGE: "payments.manage",

  // Customers & messages
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_UPDATE: "customers.update",
  REVIEWS_MODERATE: "reviews.moderate",
  MESSAGES_VIEW: "messages.view",
  MESSAGES_REPLY: "messages.reply",
  MESSAGES_MANAGE: "messages.manage",

  // Content
  PROJECTS_MANAGE: "projects.manage",
  TESTIMONIALS_MANAGE: "testimonials.manage",
  CATALOGUES_MANAGE: "catalogues.manage",
  PUBLICATIONS_MANAGE: "publications.manage",
  VISUALIZER_SCENES_MANAGE: "visualizer.scenes.manage",
  VISUALIZER_DESIGNS_VIEW: "visualizer.designs.view",
  TEAM_MANAGE: "team.manage",
  CONTENT_MANAGE: "content.manage",

  // Media
  MEDIA_VIEW: "media.view",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_DELETE: "media.delete",
  MEDIA_MANAGE: "media.manage",

  // Blog
  BLOG_VIEW: "blog.view",
  BLOG_WRITE: "blog.write",
  BLOG_EDIT_ANY: "blog.edit_any",
  BLOG_PUBLISH: "blog.publish",
  BLOG_DELETE: "blog.delete",
  BLOG_MANAGE: "blog.manage",
  NEWSLETTER_MANAGE: "newsletter.manage",

  // Reports & system
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
  REPORTS_FINANCIAL: "reports.financial",
  AUDIT_VIEW: "audit.view",
  SETTINGS_MANAGE: "settings.manage",

  // Users & access
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DEACTIVATE: "users.deactivate",
  USERS_SESSIONS: "users.sessions",
  USERS_PERMISSIONS: "users.permissions",
  USERS_MANAGE: "users.manage",
} as const satisfies Record<string, PermissionCode>;

export type PermCode = (typeof PERM)[keyof typeof PERM];

// Compile-time completeness check: errors if a catalog code has no PERM entry.
type MissingFromPerm = Exclude<PermissionCode, PermCode>;
const _permComplete: [MissingFromPerm] extends [never] ? true : never = true;
void _permComplete;

export interface PermissionOpts {
  implies?: readonly string[];
  sensitive?: boolean;
}

function p<C extends string>(
  code: C,
  label: string,
  description: string,
  opts: PermissionOpts = {},
) {
  return {
    code,
    label,
    description,
    implies: (opts.implies ?? []) as readonly string[],
    sensitive: opts.sensitive ?? false,
  };
}

export const PERMISSION_GROUPS = [
  {
    group: "Full access",
    items: [
      p(
        "admin",
        "Administrator",
        "Everything, including managing users and permissions.",
        {
          sensitive: true,
        },
      ),
    ],
  },

  // ───────────────────────── CATALOG ─────────────────────────
  {
    group: "Catalog",
    items: [
      p(
        "products.view",
        "View products (admin)",
        "See all products incl. drafts and archived.",
      ),
      p("products.create", "Create products", "Add new products.", {
        implies: ["products.view"],
      }),
      p(
        "products.update",
        "Edit products",
        "Edit product details, images and specs.",
        {
          implies: ["products.view"],
        },
      ),
      p(
        "products.publish",
        "Publish products",
        "Change product status (ACTIVE/DRAFT/ARCHIVED) and featured flag.",
        {
          implies: ["products.view"],
        },
      ),
      p("products.delete", "Delete products", "Permanently delete products.", {
        implies: ["products.view"],
      }),
      p(
        "variants.manage",
        "Manage variants",
        "Create, edit and delete variants / SKUs (non-price fields).",
        {
          implies: ["products.view"],
        },
      ),
      p(
        "pricing.manage",
        "Manage pricing",
        "Change prices, container prices, compare-at prices and currency.",
        {
          implies: ["products.view"],
          sensitive: true,
        },
      ),
      p(
        "categories.manage",
        "Manage categories",
        "Create, edit, reorder and delete categories.",
      ),
      p(
        "collections.manage",
        "Manage collections",
        "Create and edit collections and their products.",
      ),
      p(
        "products.manage",
        "Manage products (all)",
        "Create, edit and delete products, variants, pricing and categories.",
        {
          implies: [
            "products.view",
            "products.create",
            "products.update",
            "products.publish",
            "products.delete",
            "variants.manage",
            "pricing.manage",
            "categories.manage",
          ],
        },
      ),
    ],
  },
  {
    group: "Inventory",
    items: [
      p(
        "inventory.view",
        "View inventory",
        "See stock levels and the stock-movement ledger.",
      ),
      p(
        "inventory.adjust",
        "Adjust stock",
        "Record purchases, returns and manual adjustments.",
        {
          implies: ["inventory.view"],
        },
      ),
      p(
        "inventory.settings",
        "Stock settings",
        "Change reorder levels and backorder rules.",
        {
          implies: ["inventory.view"],
        },
      ),
      p(
        "inventory.manage",
        "Manage inventory (all)",
        "Adjust stock and reorder levels.",
        {
          implies: ["inventory.view", "inventory.adjust", "inventory.settings"],
        },
      ),
    ],
  },
  {
    group: "Promotions & delivery",
    items: [
      p("coupons.view", "View coupons", "See discount codes and usage."),
      p("coupons.manage", "Manage coupons", "Create and edit discount codes.", {
        implies: ["coupons.view"],
      }),
      p("delivery.view", "View delivery zones", "See delivery zones and fees."),
      p(
        "delivery.manage",
        "Manage delivery zones",
        "Create and edit delivery zones and fees.",
        {
          implies: ["delivery.view"],
        },
      ),
    ],
  },

  // ───────────────────────── SALES ─────────────────────────
  {
    group: "Orders",
    items: [
      p("orders.view", "View orders", "See all orders and customers.", {
        implies: ["customers.view"],
      }),
      p(
        "orders.update_status",
        "Update order status",
        "Move orders through processing / shipped / delivered.",
        {
          implies: ["orders.view"],
        },
      ),
      p(
        "orders.cancel",
        "Cancel orders",
        "Cancel orders on behalf of customers.",
        { implies: ["orders.view"] },
      ),
      p(
        "orders.note",
        "Internal order notes",
        "Write internal notes on orders.",
        { implies: ["orders.view"] },
      ),
      p("orders.export", "Export orders", "Download order data (CSV).", {
        implies: ["orders.view"],
      }),
      p(
        "invoices.view",
        "View invoices",
        "See and download invoices / proformas.",
        { implies: ["orders.view"] },
      ),
      p(
        "invoices.issue",
        "Issue invoices",
        "Generate invoices, proformas and credit notes.",
        {
          implies: ["invoices.view"],
        },
      ),
      p(
        "orders.manage",
        "Manage orders (all)",
        "Change order status, notes, invoices.",
        {
          implies: [
            "orders.view",
            "orders.update_status",
            "orders.cancel",
            "orders.note",
            "orders.export",
            "invoices.view",
            "invoices.issue",
          ],
        },
      ),
    ],
  },
  {
    group: "Payments",
    items: [
      p("payments.view", "View payments", "See payment records."),
      p(
        "payments.record",
        "Record payments",
        "Record manual payments (cash, bank transfer) and mark orders paid.",
        {
          implies: ["payments.view", "orders.view"],
          sensitive: true,
        },
      ),
      p(
        "payments.refund",
        "Refund payments",
        "Record and issue refunds (up to the refund limit).",
        {
          implies: ["payments.view", "orders.view"],
          sensitive: true,
        },
      ),
      p(
        "payments.manage",
        "Manage payments (all)",
        "Everything on payments, incl. refunds above the limit.",
        {
          implies: ["payments.view", "payments.record", "payments.refund"],
          sensitive: true,
        },
      ),
    ],
  },
  {
    group: "Customers & messages",
    items: [
      p(
        "customers.view",
        "View customers",
        "See customer profiles, addresses and order history.",
      ),
      p(
        "customers.update",
        "Edit customers",
        "Edit customer profiles and addresses, deactivate customer accounts.",
        {
          implies: ["customers.view"],
        },
      ),
      p(
        "reviews.moderate",
        "Moderate reviews",
        "Approve, reject and delete product reviews.",
      ),
      p(
        "messages.view",
        "View contact messages",
        "Read messages from the contact form.",
      ),
      p("messages.reply", "Reply to messages", "Reply to contact messages.", {
        implies: ["messages.view"],
      }),
      p(
        "messages.manage",
        "Manage messages",
        "Archive and delete contact messages.",
        {
          implies: ["messages.view", "messages.reply"],
        },
      ),
    ],
  },

  // ───────────────────────── SITE ─────────────────────────
  {
    group: "Content",
    items: [
      p(
        "projects.manage",
        "Manage projects",
        "Create and edit project showcases.",
      ),
      p(
        "testimonials.manage",
        "Manage testimonials",
        "Create and edit testimonials.",
      ),
      p(
        "catalogues.manage",
        "Manage catalogues",
        "Upload and edit downloadable catalogues.",
        { implies: ["media.view", "media.upload"] },
      ),
      p(
        "publications.manage",
        "Manage publications",
        "Publish announcements and promotion campaigns across the website.",
        { implies: ["media.view", "media.upload"] },
      ),
      p(
        "visualizer.scenes.manage",
        "Manage visualizer scenes",
        "Create and edit room scenes and surfaces.",
      ),
      p(
        "visualizer.designs.view",
        "View customer designs",
        "See designs customers saved in the visualizer.",
      ),
      p(
        "team.manage",
        "Manage homepage team",
        "Edit job title, bio and homepage visibility of staff.",
      ),
      p(
        "content.manage",
        "Manage content (all)",
        "Projects, collections, testimonials, catalogues, media, blog, visualizer, team.",
        {
          implies: [
            "projects.manage",
            "testimonials.manage",
            "catalogues.manage",
            "publications.manage",
            "collections.manage",
            "media.manage",
            "blog.manage",
            "visualizer.scenes.manage",
            "visualizer.designs.view",
            "team.manage",
          ],
        },
      ),
    ],
  },
  {
    group: "Media",
    items: [
      p("media.view", "View media library", "Browse uploaded files."),
      p("media.upload", "Upload media", "Upload images and files.", {
        implies: ["media.view"],
      }),
      p("media.delete", "Delete media", "Delete uploaded files.", {
        implies: ["media.view"],
      }),
      p(
        "media.manage",
        "Manage media (all)",
        "View, upload, edit and delete media.",
        {
          implies: ["media.view", "media.upload", "media.delete"],
        },
      ),
    ],
  },
  {
    group: "Blog",
    items: [
      p("blog.view", "View all posts", "See drafts and archived posts."),
      p("blog.write", "Write posts", "Create posts and edit your OWN drafts.", {
        implies: ["blog.view"],
      }),
      p(
        "blog.edit_any",
        "Edit any post",
        "Edit posts written by other people.",
        {
          implies: ["blog.view", "blog.write"],
        },
      ),
      p(
        "blog.publish",
        "Publish posts",
        "Publish, unpublish and archive posts.",
        { implies: ["blog.view"] },
      ),
      p("blog.delete", "Delete posts", "Permanently delete posts.", {
        implies: ["blog.view"],
      }),
      p("blog.manage", "Manage blog (all)", "Everything on the blog.", {
        implies: [
          "blog.view",
          "blog.write",
          "blog.edit_any",
          "blog.publish",
          "blog.delete",
        ],
      }),
    ],
  },
  {
    group: "Newsletter",
    items: [
      p(
        "newsletter.manage",
        "Manage newsletter",
        "View subscribers and send campaigns to confirmed subscribers.",
        { sensitive: true },
      ),
    ],
  },
  {
    group: "Reports & system",
    items: [
      p("reports.view", "View reports", "Analytics dashboards."),
      p("reports.export", "Export reports", "Download report data.", {
        implies: ["reports.view"],
      }),
      p(
        "reports.financial",
        "Financial reports",
        "Revenue, margins and payment reports.",
        {
          implies: ["reports.view"],
          sensitive: true,
        },
      ),
      p(
        "audit.view",
        "View audit log",
        "See who changed what (permissions, payments, prices).",
        {
          sensitive: true,
        },
      ),
      p(
        "settings.manage",
        "Manage site settings",
        "Change global site settings.",
        { sensitive: true },
      ),
    ],
  },

  // ───────────────────────── USERS ─────────────────────────
  {
    group: "Users & access",
    items: [
      p("users.view", "View all users", "See every account, staff included.", {
        implies: ["customers.view"],
      }),
      p("users.create", "Create users", "Create staff and customer accounts.", {
        implies: ["users.view"],
      }),
      p("users.update", "Edit users", "Edit any user's profile.", {
        implies: ["users.view"],
      }),
      p(
        "users.deactivate",
        "Deactivate users",
        "Deactivate / reactivate accounts (revokes sessions).",
        {
          implies: ["users.view"],
        },
      ),
      p(
        "users.sessions",
        "Manage sessions",
        "Revoke a user's refresh tokens / sign them out.",
        {
          implies: ["users.view"],
        },
      ),
      p(
        "users.permissions",
        "Assign permissions",
        "Grant and revoke permissions (only ones you hold yourself).",
        {
          implies: ["users.view"],
          sensitive: true,
        },
      ),
      p(
        "users.manage",
        "Manage users (all)",
        "Create users and assign permissions.",
        {
          implies: [
            "users.view",
            "users.create",
            "users.update",
            "users.deactivate",
            "users.sessions",
            "users.permissions",
          ],
          sensitive: true,
        },
      ),
    ],
  },
];

export const CUSTOMER_PERMISSION_GROUPS = [
  {
    group: "Customer actions",
    items: [
      p(
        CUSTOMER_PERM.REVIEWS_CREATE,
        "Write product reviews",
        "Submit a review for products you have purchased.",
      ),
    ],
  },
];

export const REGULAR_PERMISSION_CODES: string[] =
  CUSTOMER_PERMISSION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.code as string),
  );
export const REGULAR_PERMISSION_LABELS: Record<string, string> =
  Object.fromEntries(
    CUSTOMER_PERMISSION_GROUPS.flatMap((group) =>
      group.items.map((item) => [item.code, item.label]),
    ),
  );

// ───────────────────────── derived exports (same names as before) ─────────────────────────

export type PermissionItem =
  (typeof PERMISSION_GROUPS)[number]["items"][number];
export type PermissionCode = PermissionItem["code"];

export const ALL_PERMISSION_CODES: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.code as string),
);

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.code, i.label])),
);

export const PERMISSION_DESCRIPTIONS: Record<string, string> =
  Object.fromEntries(
    PERMISSION_GROUPS.flatMap((g) =>
      g.items.map((i) => [i.code, i.description]),
    ),
  );

export const PERMISSION_IMPLIES: ReadonlyMap<string, readonly string[]> =
  new Map(
    PERMISSION_GROUPS.flatMap((g) =>
      g.items.map((i) => [i.code as string, i.implies] as const),
    ),
  );

export const SENSITIVE_CODES: ReadonlySet<string> = new Set(
  PERMISSION_GROUPS.flatMap((g) =>
    g.items.filter((i) => i.sensitive).map((i) => i.code as string),
  ),
);

const KNOWN = new Set(ALL_PERMISSION_CODES);
export const isKnownCode = (code: string): boolean => KNOWN.has(code);

export const DEFAULT_STAFF_PERMISSIONS = [
  "orders.view",
  "payments.view",
  "messages.reply",
  "reviews.moderate",
];

/** Presets only fill in the checkboxes, access is still decided by the permissions. */
export const ROLE_PRESETS: {
  name: string;
  description: string;
  permissions: string[];
}[] = [
  {
    name: "Administrator",
    description: "Full access.",
    permissions: ["admin"],
  },
  {
    name: "Inventory manager",
    description: "Products, stock, and read access to orders.",
    permissions: ["products.manage", "inventory.manage", "orders.view"],
  },
  {
    name: "Sales staff",
    description: "Handles orders, sees payments, runs coupons.",
    permissions: [
      "orders.view",
      "orders.manage",
      "payments.view",
      "coupons.manage",
    ],
  },
  {
    name: "Content manager",
    description: "Site content, blog, media and products.",
    permissions: ["content.manage", "products.manage"],
  },
  {
    name: "Support staff",
    description: "Read orders and payments, answer messages, moderate reviews.",
    permissions: DEFAULT_STAFF_PERMISSIONS,
  },
  {
    name: "Finance",
    description: "Payments, refunds, invoices and financial reports.",
    permissions: [
      "payments.manage",
      "invoices.issue",
      "orders.view",
      "reports.view",
      "reports.export",
      "reports.financial",
    ],
  },
  {
    name: "Blog editor",
    description: "Writes, edits and publishes blog posts.",
    permissions: ["blog.manage", "media.upload"],
  },
  {
    name: "Showroom manager",
    description:
      "Customer-facing staff: orders, designs, messages, stock look-up.",
    permissions: [
      "orders.view",
      "visualizer.designs.view",
      "messages.reply",
      "inventory.view",
      "products.view",
    ],
  },
];

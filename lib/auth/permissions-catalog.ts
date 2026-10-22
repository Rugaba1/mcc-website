export const PERMISSION_GROUPS = [
  {
    group: "Full access",
    items: [
      {
        code: "admin",
        label: "Administrator",
        description: "Everything, including managing users.",
      },
    ],
  },
  {
    group: "Catalog",
    items: [
      {
        code: "products.manage",
        label: "Manage products",
        description: "Create, edit and delete products and variants.",
      },
      {
        code: "inventory.manage",
        label: "Manage inventory",
        description: "Adjust stock and reorder levels.",
      },
      {
        code: "coupons.manage",
        label: "Manage coupons",
        description: "Create and edit discount codes.",
      },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        code: "orders.view",
        label: "View orders",
        description: "See orders and customers.",
      },
      {
        code: "orders.manage",
        label: "Manage orders",
        description: "Change order status, notes, invoices.",
      },
      {
        code: "payments.view",
        label: "View payments",
        description: "See payment records.",
      },
      {
        code: "payments.refund",
        label: "Refund payments",
        description: "Record and issue refunds.",
      },
    ],
  },
  {
    group: "Site",
    items: [
      {
        code: "content.manage",
        label: "Manage content",
        description: "Projects, collections, testimonials, catalogues, media.",
      },
      {
        code: "reports.view",
        label: "View reports",
        description: "Analytics dashboards.",
      },
      {
        code: "users.manage",
        label: "Manage users",
        description: "Create users and assign permissions.",
      },
    ],
  },
] as const;

export const ALL_PERMISSION_CODES: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.code),
);

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.code, i.label])),
);

/** Presets only fill in the checkboxes — access is still decided by the permissions. */
export const ROLE_PRESETS: { name: string; permissions: string[] }[] = [
  { name: "Administrator", permissions: ["admin"] },
  {
    name: "Inventory manager",
    permissions: ["products.manage", "inventory.manage", "orders.view"],
  },
  {
    name: "Sales staff",
    permissions: [
      "orders.view",
      "orders.manage",
      "payments.view",
      "coupons.manage",
    ],
  },
  {
    name: "Content manager",
    permissions: ["content.manage", "products.manage"],
  },
  { name: "Support staff", permissions: ["orders.view", "payments.view"] },
];

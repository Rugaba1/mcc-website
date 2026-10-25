import {
  Boxes,
  CreditCard,
  CircleDollarSign,
  FileText,
  Heart,
  LayoutDashboard,
  Mail,
  Send,
  ShieldBan,
  Newspaper,
  Package,
  Palette,
  Receipt,
  ChartNoAxesCombined,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  FolderKanban,
  Layers,
  MessageSquareQuote,
  UserRoundCheck,
} from "lucide-react";
import { PERM, type PermCode } from "@/lib/permissions/catalog";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // only active on an exact match (for section roots)
  permission?: PermCode | readonly PermCode[];
};

export const customerNav: NavItem[] = [
  { name: "My Account", href: "/account", icon: UserCircle, exact: true },
  { name: "Orders", href: "/account/orders", icon: ShoppingCart },
  { name: "My Designs", href: "/account/designs", icon: Palette },
  { name: "Payments", href: "/account/payments", icon: CreditCard },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Settings", href: "/account/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true, permission: PERM.REPORTS_VIEW },
  { name: "Reports", href: "/admin/reports", icon: ChartNoAxesCombined, permission: PERM.REPORTS_VIEW },
  { name: "Products", href: "/admin/products", icon: Package, permission: PERM.PRODUCTS_VIEW },
  { name: "Collections", href: "/admin/collections", icon: Layers, permission: PERM.COLLECTIONS_MANAGE },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban, permission: PERM.PROJECTS_MANAGE },
  {
    name: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareQuote,
    permission: PERM.TESTIMONIALS_MANAGE,
  },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes, permission: PERM.INVENTORY_VIEW },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, permission: PERM.ORDERS_VIEW },
  { name: "Reviews", href: "/admin/reviews", icon: Star, permission: PERM.REVIEWS_MODERATE },
  { name: "Saved Designs", href: "/admin/designs", icon: Palette, permission: PERM.VISUALIZER_DESIGNS_VIEW },
  { name: "Visualizer", href: "/admin/visualizer", icon: Palette, permission: PERM.VARIANTS_MANAGE },
  { name: "Customers", href: "/admin/customers", icon: UserRoundCheck, permission: PERM.CUSTOMERS_VIEW },
  { name: "Payments", href: "/admin/payments", icon: CreditCard, permission: PERM.PAYMENTS_VIEW },
  { name: "Coupons", href: "/admin/coupons", icon: Tags, permission: PERM.COUPONS_VIEW },
  { name: "Currencies", href: "/admin/currencies", icon: CircleDollarSign, permission: PERM.SETTINGS_MANAGE },
  { name: "Staff Management", href: "/admin/staff", icon: Users, permission: PERM.USERS_VIEW },
  { name: "Messages", href: "/admin/messages", icon: Mail, permission: PERM.MESSAGES_VIEW },
  { name: "Files", href: "/admin/files", icon: FolderKanban, permission: PERM.MEDIA_VIEW },
  { name: "Blogs", href: "/admin/blog", icon: Newspaper, permission: PERM.BLOG_VIEW },
  { name: "Legal documents", href: "/admin/legal", icon: FileText, permission: PERM.CONTENT_MANAGE },
  { name: "Newsletter", href: "/admin/newsletter", icon: Send, permission: PERM.NEWSLETTER_MANAGE },
  { name: "Users", href: "/admin/users", icon: UserCircle, permission: PERM.USERS_VIEW },
  { name: "Blocked emails", href: "/admin/blocked-emails", icon: ShieldBan, permission: PERM.USERS_PERMISSIONS },
];

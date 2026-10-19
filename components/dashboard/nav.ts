import {
  Boxes,
  CreditCard,
  Heart,
  LayoutDashboard,
  Mail,
  Package,
  Palette,
  Receipt,
  Settings,
  ShoppingCart,
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

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // only active on an exact match (for section roots)
};

export const customerNav: NavItem[] = [
  { name: "My Account", href: "/account", icon: UserCircle, exact: true },
  { name: "Orders", href: "/account/orders", icon: Receipt },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Settings", href: "/account/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Collections", href: "/admin/collections", icon: Layers },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  {
    name: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareQuote,
  },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: UserRoundCheck },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  // { name: "Visualizer", href: "/admin/visualizer", icon: Palette },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Messages", href: "/admin/messages", icon: Mail },
  { name: "Files", href: "/admin/files", icon:  FolderKanban, },
];
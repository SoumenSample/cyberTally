import {
  LayoutDashboard,
  Receipt,
  Boxes,
  FileText,
  Users,
  Settings,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Accounting",
    url: "/dashboard/accounting",
    icon: Receipt,
  },

  {
    title: "Inventory",
    url: "/dashboard/inventory",
    icon: Boxes,
  },

  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },

  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
  },

  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];
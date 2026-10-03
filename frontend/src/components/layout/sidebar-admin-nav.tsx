import {
  TrayIcon,
  StorefrontIcon,
  TrendUpIcon,
  WarehouseIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { NavGroup } from "./sidebar-types";

export const adminNavGroups: NavGroup[] = [
  {
    label: "Personnel & Access",
    items: [
      {
        title: "Staff & Users",
        id: "admin-users",
        path: "/admin/users",
        icon: <UsersIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Master Domain",
    items: [
      {
        title: "Retail Outlets",
        id: "admin-outlets",
        path: "/admin/outlets",
        icon: <StorefrontIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Distribution Hubs",
        id: "admin-depots",
        path: "/admin/depots",
        icon: <WarehouseIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Catalog & SKUs",
        id: "admin-items",
        path: "/admin/items",
        icon: <TrayIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Calendar & Surges",
        id: "admin-calendar",
        path: "/admin/calendar",
        icon: <TrendUpIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

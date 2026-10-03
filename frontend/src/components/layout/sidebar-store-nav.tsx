import {
  SquaresFourIcon,
  TrayIcon,
  ChartBarIcon,
  WarningOctagonIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import type { NavGroup } from "./sidebar-types";

export const storeNavGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "dashboard",
        path: "/store/dashboard",
        icon: <SquaresFourIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "System alerts",
            id: "system-alerts",
            path: "/store/dashboard",
          },
        ],
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Order queue",
        id: "order-queue",
        path: "/store/orders",
        icon: <TrayIcon weight="duotone" className="size-5" />,
        badge: 24,
      },
      {
        title: "New order",
        id: "new-order",
        path: "/store/orders/new",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Deferrals",
        id: "deferrals",
        path: "/store/deferrals/unserved",
        icon: <WarningOctagonIcon weight="duotone" className="size-5" />,
        badge: 3,
        badgeVariant: "warning",
        items: [
          {
            title: "Un served queue",
            id: "unserved-queue",
            path: "/store/deferrals/unserved",
            badge: 3,
          },
          {
            title: "Deferral log",
            id: "deferral-log",
            path: "/store/deferrals/log",
          },
          {
            title: "Carryover",
            id: "carryover",
            path: "/store/deferrals/carryover",
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        title: "Reports",
        id: "reports",
        path: "/store/reports",
        icon: <FileTextIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

import {
  SquaresFourIcon,
  TrayIcon,
  ChartBarIcon,
  WarningOctagonIcon,
  NavigationArrowIcon,
  TruckIcon,
  StorefrontIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import type { NavGroup } from "./sidebar-types";

export const dispatcherNavGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "dashboard",
        path: "/dispatcher/dashboard",
        icon: <SquaresFourIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Order queue",
        id: "order-queue",
        path: "/dispatcher/orders",
        icon: <TrayIcon weight="duotone" className="size-5" />,
        badge: 14,
      },
      {
        title: "Allocation",
        id: "allocation",
        path: "/dispatcher/allocations",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "Summary",
            id: "allocation-summary",
            path: "/dispatcher/allocations",
          },
          {
            title: "Detail",
            id: "allocation-detail",
            path: "/dispatcher/allocations/alloc-01",
          },
        ],
      },
      {
        title: "Deferrals",
        id: "deferrals",
        path: "/dispatcher/deferrals/carryover",
        icon: <WarningOctagonIcon weight="duotone" className="size-5" />,
        badge: 4,
        badgeVariant: "warning",
        items: [
          {
            title: "Carryover",
            id: "carryover",
            path: "/dispatcher/deferrals/carryover",
            badge: 4,
          },
          {
            title: "Deferral log",
            id: "deferral-log",
            path: "/dispatcher/deferrals/audit-log",
          },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Live Tracking",
        id: "live-tracking",
        path: "/dispatcher/live-map",
        icon: <NavigationArrowIcon weight="duotone" className="size-5" />,
        badge: "Live",
        badgeVariant: "info",
      },
      {
        title: "Fleet",
        id: "fleet",
        path: "/dispatcher/fleet/vehicles",
        icon: <TruckIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "Vehicles",
            id: "vehicles",
            path: "/dispatcher/fleet/vehicles",
          },
          {
            title: "Workshop log",
            id: "workshop-log",
            path: "/dispatcher/fleet/workshop-log",
          },
          {
            title: "Fuel quotas",
            id: "fuel-quotas",
            path: "/dispatcher/fleet/fuel-quotas",
          },
        ],
      },
      {
        title: "Outlets",
        id: "outlets",
        path: "/dispatcher/outlets",
        icon: <StorefrontIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Trip metrics",
        id: "trip-metrics",
        path: "/dispatcher/analytics/trips",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Sustainability",
        id: "sustainability",
        path: "/dispatcher/analytics/sustainability",
        icon: <TrendUpIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

import * as React from "react";
import {
  ShieldCheckIcon,
  WarehouseIcon,
  TruckIcon,
  StorefrontIcon,
  UsersIcon,
} from "@phosphor-icons/react";

export const ROLE_LABELS: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  system_admin: {
    label: "System Admin",
    badgeClass: "bg-purple-900/80 text-purple-200 border border-purple-700/50",
    icon: <ShieldCheckIcon className="size-3.5" />,
  },
  dispatcher: {
    label: "Dispatcher",
    badgeClass: "bg-blue-900/80 text-blue-200 border border-blue-700/50",
    icon: <WarehouseIcon className="size-3.5" />,
  },
  loader: {
    label: "Bay Loader",
    badgeClass: "bg-amber-900/80 text-amber-200 border border-amber-700/50",
    icon: <WarehouseIcon className="size-3.5" />,
  },
  driver: {
    label: "Fleet Driver",
    badgeClass: "bg-emerald-900/80 text-emerald-200 border border-emerald-700/50",
    icon: <TruckIcon className="size-3.5" />,
  },
  store_manager: {
    label: "Store Manager",
    badgeClass: "bg-teal-900/80 text-teal-200 border border-teal-700/50",
    icon: <StorefrontIcon className="size-3.5" />,
  },
};

export function getRoleConfig(role: string) {
  return (
    ROLE_LABELS[role] || {
      label: role,
      badgeClass: "bg-muted text-muted-foreground",
      icon: <UsersIcon className="size-3.5" />,
    }
  );
}

import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import type { StoreOrderRecord } from "../types";

interface OrderStatusBadgeProps {
  status: StoreOrderRecord["status"];
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case "in_transit":
      return (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20 font-medium">
          <TruckIcon className="size-3.5 mr-1 shrink-0" />
          In Transit
        </Badge>
      );
    case "loading":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20 font-medium">
          <ClockIcon className="size-3.5 mr-1 shrink-0" />
          Loading
        </Badge>
      );
    case "served":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium">
          <CheckCircleIcon className="size-3.5 mr-1 shrink-0" />
          Served
        </Badge>
      );
    case "deferred":
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20 font-medium">
          <WarningCircleIcon className="size-3.5 mr-1 shrink-0" />
          Deferred
        </Badge>
      );
    case "pending":
    default:
      return (
        <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/20 font-medium">
          <ClockIcon className="size-3.5 mr-1 shrink-0" />
          Pending
        </Badge>
      );
  }
}

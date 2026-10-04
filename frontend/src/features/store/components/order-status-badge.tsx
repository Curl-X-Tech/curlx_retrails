import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { StoreOrderRecord } from "../types";

interface OrderStatusBadgeProps {
  status: StoreOrderRecord["status"];
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case "in_transit":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-700 text-white">
          <TruckIcon className="size-3 mr-1 shrink-0" weight="bold" />
          In Transit
        </span>
      );
    case "loading":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
          <ClockIcon className="size-3 mr-1 shrink-0" weight="bold" />
          Loading
        </span>
      );
    case "served":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
          <CheckCircleIcon className="size-3 mr-1 shrink-0" weight="bold" />
          Served
        </span>
      );
    case "deferred":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
          <WarningCircleIcon className="size-3 mr-1 shrink-0" weight="bold" />
          Deferred
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-600 text-white">
          <ClockIcon className="size-3 mr-1 shrink-0" weight="bold" />
          Pending
        </span>
      );
  }
}

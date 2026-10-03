import { mockVehicleAllocations } from "@/data/mock-allocations";
import { getManifestForAllocation } from "@/data/mock-allocation-details";

export interface CrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
  isCode?: boolean;
}

export function getBreadcrumbs(pathname: string): CrumbItem[] {
  if (pathname === "/admin/outlets" || pathname.startsWith("/admin/outlets")) {
    return [{ label: "Master Domain" }, { label: "Retail Outlets", isCurrent: true }];
  }
  if (pathname === "/admin/depots" || pathname.startsWith("/admin/depots")) {
    return [{ label: "Master Domain" }, { label: "Distribution Hubs", isCurrent: true }];
  }
  if (pathname === "/admin/items" || pathname.startsWith("/admin/items")) {
    return [{ label: "Master Domain" }, { label: "Catalog & SKUs", isCurrent: true }];
  }
  if (pathname === "/admin/calendar" || pathname.startsWith("/admin/calendar")) {
    return [{ label: "Master Domain" }, { label: "Logistics Calendar", isCurrent: true }];
  }
  if (pathname === "/admin/users" || pathname.startsWith("/admin/users")) {
    return [{ label: "Personnel & Access" }, { label: "Staff & Users", isCurrent: true }];
  }
  if (pathname.startsWith("/admin")) {
    return [{ label: "Master Domain" }, { label: "Administration", isCurrent: true }];
  }

  if (pathname.startsWith("/dispatcher/allocations/")) {
    const allocId = pathname.replace("/dispatcher/allocations/", "");
    const activeAlloc =
      mockVehicleAllocations.find((a) => a.id === allocId) || mockVehicleAllocations[0];
    const manifestCode = getManifestForAllocation(activeAlloc).manifestCode;
    return [
      { label: "Planning" },
      { label: "Allocation", path: "/dispatcher/allocations" },
      { label: "Detail", path: `/dispatcher/allocations/${allocId}` },
      { label: `# ${manifestCode}`, isCurrent: true, isCode: true },
    ];
  }

  if (pathname === "/dispatcher/allocations" || pathname === "/dispatcher/allocations/") {
    return [
      { label: "Planning" },
      { label: "Allocation", path: "/dispatcher/allocations" },
      { label: "Summary", isCurrent: true },
    ];
  }

  if (pathname === "/store/dashboard" || pathname === "/store/alerts") {
    return [{ label: "Dashboard" }, { label: "System alerts", isCurrent: true }];
  }
  if (
    pathname === "/store/orders" ||
    pathname === "/store/orders/" ||
    pathname === "/store/queue"
  ) {
    return [{ label: "Planning" }, { label: "Order queue", isCurrent: true }];
  }
  if (pathname === "/store/orders/new" || pathname === "/store/create-order") {
    return [
      { label: "Planning" },
      { label: "New Order #Draft", isCurrent: true, isCode: true },
    ];
  }
  if (pathname === "/store/deferrals/unserved" || pathname === "/store/deferrals") {
    return [
      { label: "Planning" },
      { label: "Deferrals", path: "/store/deferrals/unserved" },
      { label: "Un served queue", isCurrent: true },
    ];
  }
  if (pathname === "/store/deferrals/log") {
    return [
      { label: "Planning" },
      { label: "Deferrals", path: "/store/deferrals/unserved" },
      { label: "Deferral log", isCurrent: true },
    ];
  }
  if (pathname === "/store/deferrals/carryover") {
    return [
      { label: "Planning" },
      { label: "Deferrals", path: "/store/deferrals/unserved" },
      { label: "Carryover", isCurrent: true },
    ];
  }
  if (pathname === "/store/reports") {
    return [{ label: "Reports", isCurrent: true }];
  }

  if (pathname === "/dispatcher/orders" || pathname === "/dispatcher/orders/") {
    return [{ label: "Planning" }, { label: "Order queue", isCurrent: true }];
  }
  if (
    pathname === "/dispatcher/deferrals/carryover" ||
    pathname === "/dispatcher/deferrals" ||
    pathname === "/dispatcher/deferrals/"
  ) {
    return [
      { label: "Planning" },
      { label: "Deferrals", path: "/dispatcher/deferrals/carryover" },
      { label: "Carryover", isCurrent: true },
    ];
  }
  if (
    pathname === "/dispatcher/deferrals/audit-log" ||
    pathname === "/dispatcher/deferrals/deferral-log"
  ) {
    return [
      { label: "Planning" },
      { label: "Deferrals", path: "/dispatcher/deferrals/carryover" },
      { label: "Deferral log", isCurrent: true },
    ];
  }
  if (pathname === "/dispatcher/live-map" || pathname === "/dispatcher/live-tracking") {
    return [{ label: "Operations" }, { label: "Live Tracking", isCurrent: true }];
  }
  if (pathname.startsWith("/dispatcher/fleet")) {
    return [
      { label: "Operations" },
      { label: "Fleet", path: "/dispatcher/fleet/vehicles" },
      { label: "Vehicles", isCurrent: true },
    ];
  }
  if (pathname === "/dispatcher/dashboard") {
    return [{ label: "Dashboard", isCurrent: true }];
  }

  return [{ label: "ReTrails Console", isCurrent: true }];
}

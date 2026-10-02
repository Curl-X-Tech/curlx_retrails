import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { mockVehicleAllocations } from "@/data/mock-allocations";
import { getManifestForAllocation } from "@/data/mock-allocation-details";

interface CrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
  isCode?: boolean;
}

function getBreadcrumbs(pathname: string): CrumbItem[] {
  // Admin Routes
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
  if (
    pathname === "/admin/dashboard" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin")
  ) {
    return [{ label: "Overview" }, { label: "Dashboard", isCurrent: true }];
  }

  // Dispatcher Routes
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

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStoreRole =
    user?.role === "store_manager" || location.pathname.startsWith("/store");
  const crumbs = getBreadcrumbs(location.pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-muted/20 flex flex-col h-screen overflow-hidden">
        {/* Top bar header strictly matching sidebar h-16 height */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb className="flex items-center truncate">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() =>
                      navigate(isStoreRole ? "/store/orders" : "/dispatcher/orders")
                    }
                    className="cursor-pointer hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5"
                  >
                    <img
                      src="/icon.png"
                      alt="ReTrails Logo"
                      className="size-4 object-contain rounded-xs"
                    />
                    <span>ReTrails</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {crumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <BreadcrumbSeparator className="hidden sm:inline" />
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage
                          className={
                            crumb.isCode
                              ? "font-bold tracking-tight text-foreground text-xs sm:text-sm"
                              : "text-xs sm:text-sm font-semibold"
                          }
                        >
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : crumb.path ? (
                        <BreadcrumbLink
                          onClick={() => navigate(crumb.path!)}
                          className="cursor-pointer hover:text-foreground transition-colors text-xs sm:text-sm"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-muted-foreground font-medium text-xs sm:text-sm">
                          {crumb.label}
                        </span>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

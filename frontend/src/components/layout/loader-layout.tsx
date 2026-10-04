import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LoaderSidebar } from "./loader-sidebar";
import { LoaderBottomNav } from "./loader-bottom-nav";
import { SyncStatusIndicator } from "@/components/shared";

export function LoaderLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardActive =
    location.pathname === "/loader" || location.pathname === "/loader/dashboard";
  const isManifestsActive =
    location.pathname.startsWith("/loader/manifests") ||
    location.pathname.startsWith("/loader/queue");
  const isBaysActive = location.pathname.startsWith("/loader/bays");
  const isExceptionsActive = location.pathname.startsWith("/loader/exceptions");

  const pageTitle = isDashboardActive
    ? "Dock Dashboard"
    : isBaysActive
      ? "Bay Checklist"
      : isExceptionsActive
        ? "Exceptions & Shortfalls"
        : "Manifests Queue";

  return (
    <div className="flex h-dvh max-h-dvh w-screen overflow-hidden bg-background text-foreground font-sans flex-col md:flex-row">
      <LoaderSidebar
        isDashboardActive={isDashboardActive}
        isManifestsActive={isManifestsActive}
        isExceptionsActive={isExceptionsActive}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border bg-card px-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Breadcrumb className="flex items-center">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate("/loader/dashboard")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <img
                      src="/icon.png"
                      alt="ReTrails Logo"
                      className="size-4 object-contain rounded-xs"
                    />
                    <span className="hidden sm:inline">ReTrails</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <BreadcrumbLink
                    onClick={() => navigate("/loader/dashboard")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
                  >
                    Dock Operations
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground text-xs sm:text-sm">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatusIndicator />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-background p-3 sm:p-5">
          <Outlet />
        </main>

        <LoaderBottomNav
          isDashboardActive={isDashboardActive}
          isManifestsActive={isManifestsActive}
          isExceptionsActive={isExceptionsActive}
        />
      </div>
    </div>
  );
}

export default LoaderLayout;

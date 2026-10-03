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

export function LoaderLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isManifestsActive =
    location.pathname.startsWith("/loader/manifests") ||
    location.pathname.startsWith("/loader/queue");
  const isBaysActive =
    location.pathname.startsWith("/loader/bays") ||
    (!isManifestsActive && location.pathname.startsWith("/loader"));

  return (
    <div className="flex h-dvh max-h-dvh w-screen overflow-hidden bg-background text-foreground font-sans">
      <LoaderSidebar isManifestsActive={isManifestsActive} isBaysActive={isBaysActive} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Breadcrumb className="flex items-center">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate("/loader/manifests")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <img
                      src="/icon.png"
                      alt="ReTrails Logo"
                      className="size-4 object-contain rounded-xs"
                    />
                    <span>ReTrails</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate("/loader/manifests")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
                  >
                    Dock Operations
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground text-xs sm:text-sm">
                    {isBaysActive ? "Bay Station Allocator" : "Loading Manifests Queue"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Station: Bay 04</span>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-background p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LoaderLayout;

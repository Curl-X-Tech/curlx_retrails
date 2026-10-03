import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { AppBreadcrumbs } from "./app-breadcrumbs";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStoreRole =
    user?.role === "store_manager" || location.pathname.startsWith("/store");

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-muted/20 flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 truncate">
              <button
                type="button"
                onClick={() =>
                  navigate(isStoreRole ? "/store/orders" : "/dispatcher/orders")
                }
                className="cursor-pointer hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground"
              >
                <img
                  src="/icon.png"
                  alt="ReTrails Logo"
                  className="size-4 object-contain rounded-xs"
                />
                <span>ReTrails</span>
              </button>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <AppBreadcrumbs pathname={location.pathname} />
            </div>
          </div>
        </header>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

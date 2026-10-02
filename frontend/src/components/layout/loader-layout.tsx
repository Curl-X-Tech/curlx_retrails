import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  TruckIcon,
  UserCircleIcon,
  ListBulletsIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export function LoaderLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isManifestsActive =
    location.pathname.startsWith("/loader/manifests") ||
    location.pathname.startsWith("/loader/queue");
  const isBaysActive =
    location.pathname.startsWith("/loader/bays") ||
    (!isManifestsActive && location.pathname.startsWith("/loader"));

  return (
    <div className="flex h-dvh max-h-dvh w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Center-Aligned Slim Icon Sidebar */}
      <aside className="flex flex-col items-center justify-between border-r border-border/80 bg-sidebar py-3 w-16 shrink-0 z-30 select-none">
        {/* Top: Logo & Dual Navigation Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Logo Mark */}
          <div className="flex size-10 items-center justify-center rounded-xl bg-card border border-border/60 shadow-xs overflow-hidden p-1.5">
            <img
              src="/icon.png"
              alt="ReTrails Logo"
              className="size-full object-contain"
            />
          </div>

          <Separator className="w-8 bg-border/60" />

          {/* Navigation Buttons */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {/* 1. Manifests & History List */}
            <button
              onClick={() => navigate("/loader/manifests")}
              title="Dock Queue & Loading Manifests"
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl transition-all cursor-pointer shadow-xs",
                isManifestsActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <ListBulletsIcon className="size-5.5" weight="bold" />
            </button>

            {/* 2. Active Loading Bay Station */}
            <button
              onClick={() => navigate("/loader/bays")}
              title="Active Loading Bay Manifest"
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl transition-all cursor-pointer shadow-xs",
                isBaysActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <TruckIcon className="size-5.5" weight="bold" />
            </button>
          </nav>
        </div>

        {/* Bottom Profile & Role Actions */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors cursor-pointer"
              title="User Account"
            >
              <UserCircleIcon className="size-7" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-56 p-1.5 shadow-lg rounded-xl"
            >
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in as{" "}
                <span className="font-semibold text-foreground block truncate">
                  {user?.name || "Loader Staff"}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {user?.email || "loader@curlx.tech"}
                </span>
              </div>
              <div className="px-2 py-1 flex items-center justify-between text-xs border-t border-border/50 my-1">
                <span className="text-muted-foreground">Station</span>
                <span className="font-bold text-foreground capitalize px-1.5 py-0.5 rounded bg-muted text-[10px]">
                  Bay Loader
                </span>
              </div>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="text-destructive focus:text-destructive cursor-pointer text-xs font-semibold p-2 rounded-lg gap-2"
              >
                <SignOutIcon className="size-4" />
                <span>Log out of Station</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Tablet Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Strictly Matching Dispatcher h-16 Height & Breadcrumb Architecture */}
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

        {/* Viewport Content */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-background p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LoaderLayout;

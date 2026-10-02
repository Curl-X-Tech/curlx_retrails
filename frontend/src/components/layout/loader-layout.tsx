import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  TruckIcon,
  UserCircleIcon,
  SwapIcon,
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
  const { user, setRole, logout } = useAuth();

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
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-heading font-black text-sm tracking-wider">
            CX
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

        {/* Bottom Profile & Role Switcher */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors cursor-pointer"
              title="Switch Role or Account"
            >
              <UserCircleIcon className="size-7" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Logged in as{" "}
                <span className="font-semibold text-foreground">
                  {user?.name || "Loader Staff"}
                </span>
              </div>
              <DropdownMenuItem onClick={() => setRole("loader")}>
                <span className="text-xs font-semibold">Active Role: Loader</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRole("driver");
                  navigate("/driver/active");
                }}
              >
                <SwapIcon className="size-4 mr-2" />
                Switch to Driver
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRole("dispatcher");
                  navigate("/dispatcher/allocations");
                }}
              >
                <SwapIcon className="size-4 mr-2" />
                Switch to Dispatcher
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <SignOutIcon className="size-4 mr-2" />
                Log out
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
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
                  >
                    ReTrails
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
                  <BreadcrumbPage className="font-bold tracking-tight text-foreground text-xs sm:text-sm">
                    {isManifestsActive ? "Manifests & Queue" : "Bay Station Work area"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Depot:</span>
              <strong className="text-foreground font-semibold">
                {user?.depotName || "Peliyagoda Depot"}
              </strong>
            </div>
            <Separator
              orientation="vertical"
              className="hidden sm:block h-4 bg-border/80"
            />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground">
              <span>Role:</span>
              <strong className="text-foreground">loader</strong>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-hidden bg-muted/20 px-3.5 sm:px-5 py-3 flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

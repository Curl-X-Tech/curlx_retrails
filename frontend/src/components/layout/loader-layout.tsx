import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { TruckIcon, UserCircleIcon, SwapIcon } from "@phosphor-icons/react";
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

export function LoaderLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setRole } = useAuth();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Center-Aligned Slim Icon Sidebar */}
      <aside className="flex flex-col items-center justify-between border-r border-border/80 bg-sidebar py-3 w-16 shrink-0 z-30 select-none">
        {/* Top: Logo & Single Large Centered Nav Action */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Logo Mark */}
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-heading font-black text-sm tracking-wider">
            CX
          </div>

          <Separator className="w-8 bg-border/60" />

          {/* Single Large Centered Navigation Button */}
          <nav className="flex flex-col items-center w-full px-2">
            <button
              onClick={() => navigate("/loader/bays")}
              title="Loading Bays Manifest"
              className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
            >
              <TruckIcon className="size-6" weight="bold" />
            </button>
          </nav>
        </div>

        {/* Bottom Profile & Role Switcher */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
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
                  setRole("dispatcher");
                  navigate("/dispatcher/allocations");
                }}
              >
                <SwapIcon className="size-4 mr-2" />
                Switch to Dispatcher
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
                    onClick={() => navigate("/loader/bays")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
                  >
                    ReTrails
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate("/loader/bays")}
                    className="cursor-pointer hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
                  >
                    Loading Bay Station
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold tracking-tight text-foreground text-xs sm:text-sm">
                    {location.pathname.startsWith("/loader/bays")
                      ? "Bay 4C Manifest"
                      : "Station Work area"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Depot:</span>
              <strong className="text-foreground font-semibold">Peliyagoda Hub</strong>
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
        <main className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

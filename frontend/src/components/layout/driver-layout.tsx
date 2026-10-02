import * as React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ListIcon,
  HouseIcon,
  NavigationArrowIcon,
  ListBulletsIcon,
  TruckIcon,
  UserCircleIcon,
  CoffeeIcon,
  CheckCircleIcon,
  SignOutIcon,
  CloudSlashIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { useSyncState } from "@/hooks/use-offline-trip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import { cn } from "@/lib/utils";

export function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isOnline, state: syncState, pendingCount } = useSyncState();
  const [isOnBreak, setIsOnBreak] = React.useState(mockDriverTrip.onBreak);
  const [breakTimerSeconds, setBreakTimerSeconds] = React.useState(0);
  const [isBreakModalOpen, setIsBreakModalOpen] = React.useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = React.useState(false);

  // Live break timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setBreakTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isHomeActive =
    location.pathname === "/driver" ||
    location.pathname === "/driver/" ||
    location.pathname.startsWith("/driver/trips");
  const isActiveRun =
    location.pathname.startsWith("/driver/active") ||
    location.pathname.startsWith("/driver/run");
  const isStopsActive =
    location.pathname.startsWith("/driver/stops") ||
    location.pathname.startsWith("/driver/unload");

  return (
    <div className="h-dvh max-h-dvh w-screen overflow-hidden bg-muted/40 flex justify-center font-sans select-none">
      {/* Mobile Smartphone / Handheld Field Container (Tier 4 Responsive Shell) */}
      <div className="w-full max-w-md h-full bg-background flex flex-col shadow-2xl relative border-x border-border/60 overflow-hidden">
        {/* 1. Header (Clean, minimal, no noisy badges) */}
        <header className="h-14 shrink-0 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 flex items-center justify-between z-30">
          {/* Left: Drawer Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMenuDrawerOpen(true)}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <ListIcon className="size-5" weight="bold" />
            </button>
          </div>

          {/* Center: Trip Manifest & Active Reg */}
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-sm text-foreground">
              {mockDriverTrip.tripCode}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">·</span>
            <span className="text-xs font-bold text-muted-foreground">
              #{mockDriverTrip.regNumber}
            </span>
          </div>

          {/* Right: Add Break Action Button */}
          {isOnBreak ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsOnBreak(false)}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-sm animate-pulse cursor-pointer"
            >
              <CoffeeIcon className="size-3.5" weight="bold" />
              <span>Resume ({formatTimer(breakTimerSeconds)})</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsBreakModalOpen(true)}
              className="h-8 px-3.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
            >
              Add Break
            </Button>
          )}
        </header>

        {/* Solid Red Offline Banner Below Top Bar */}
        {!isOnline && (
          <div className="bg-red-600 text-white text-xs font-semibold px-3.5 py-2 flex items-center justify-between shadow-xs shrink-0 z-20">
            <div className="flex items-center gap-2">
              <CloudSlashIcon className="size-4 shrink-0" weight="bold" />
              <span>Offline Mode — All actions saved locally</span>
            </div>
            {pendingCount > 0 && (
              <span className="text-[11px] bg-red-800/90 text-white px-2 py-0.5 rounded-md font-bold">
                {pendingCount} pending
              </span>
            )}
          </div>
        )}

        {/* Sky Syncing Progress Banner Below Top Bar */}
        {isOnline && (syncState === "syncing" || pendingCount > 0) && (
          <div className="bg-sky-600 text-white text-xs font-semibold px-3.5 py-1.5 flex items-center justify-between shadow-xs shrink-0 z-20">
            <div className="flex items-center gap-2">
              <ArrowsClockwiseIcon
                className="size-3.5 shrink-0 animate-spin"
                weight="bold"
              />
              <span>Syncing offline actions with server...</span>
            </div>
            <span className="text-[11px] bg-sky-800/90 text-white px-2 py-0.5 rounded-md font-bold">
              {pendingCount} remaining
            </span>
          </div>
        )}

        {/* 2. Main Mobile Field Viewport */}
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <Outlet />
        </main>

        {/* 3. Bottom Mobile Navigation Tabs */}
        <nav className="h-14 shrink-0 bg-background border-t border-border/80 grid grid-cols-4 px-2 z-30 shadow-lg">
          {/* Tab 1: Home (Assigned Trips) */}
          <button
            onClick={() => navigate("/driver/trips")}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
              isHomeActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <HouseIcon className="size-4.5" weight={isHomeActive ? "fill" : "bold"} />
            <span className="text-[10px]">Home</span>
          </button>

          {/* Tab 2: Active Run / Navigation */}
          <button
            onClick={() => navigate("/driver/active")}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
              isActiveRun
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <NavigationArrowIcon
              className="size-4.5"
              weight={isActiveRun ? "fill" : "bold"}
            />
            <span className="text-[10px]">Active Run</span>
          </button>

          {/* Tab 3: Stops / Locations */}
          <button
            onClick={() => navigate("/driver/stops")}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative",
              isStopsActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <ListBulletsIcon
              className="size-4.5"
              weight={isStopsActive ? "bold" : "regular"}
            />
            <span className="text-[10px]">Stops ({mockDriverTrip.waypoints.length})</span>
          </button>

          {/* Tab 4: Profile & Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <UserCircleIcon className="size-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="end"
              className="w-56 mb-2 p-1.5 shadow-lg rounded-xl"
            >
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Driver:{" "}
                <span className="font-semibold text-foreground block truncate">
                  {user?.name || mockDriverTrip.driver.name}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {user?.email || "driver@curlx.tech"}
                </span>
              </div>
              <div className="px-2 py-1 flex items-center justify-between text-xs border-t border-border/50 my-1">
                <span className="text-muted-foreground">Console</span>
                <span className="font-bold text-foreground capitalize px-1.5 py-0.5 rounded bg-muted text-[10px]">
                  Driver Console
                </span>
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/driver/trips")}
                className="cursor-pointer text-xs font-semibold p-2 rounded-lg gap-2 text-foreground"
              >
                <TruckIcon className="size-4 text-primary" />
                <span>Assigned Trips ({syncState})</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="text-destructive focus:text-destructive cursor-pointer text-xs font-semibold p-2 rounded-lg gap-2"
              >
                <SignOutIcon className="size-4" />
                <span>Log out of Pilot Console</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* 4. Left Menu / Trip Overview Drawer */}
        <Sheet open={isMenuDrawerOpen} onOpenChange={setIsMenuDrawerOpen}>
          <SheetContent side="left" className="w-80 p-0 flex flex-col bg-card">
            <SheetHeader className="p-4 pb-3 border-b border-border/70 text-left">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="size-8 rounded-lg bg-card border border-border/70 overflow-hidden p-1 shrink-0 flex items-center justify-center shadow-2xs">
                  <img
                    src="/icon.png"
                    alt="ReTrails Logo"
                    className="size-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-heading font-black text-sm text-foreground leading-tight">
                    ReTrails Driver
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Pilot Operating Console
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    navigate("/driver/trips");
                  }}
                  className="w-full text-xs font-semibold gap-1.5 h-8 justify-center"
                >
                  <TruckIcon className="size-4 text-primary" />
                  <span>Switch Assigned Trip</span>
                </Button>
              </div>
              <SheetTitle className="font-heading font-black text-base text-foreground flex items-center justify-between">
                <span>Trip Manifest {mockDriverTrip.tripCode}</span>
                <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                  {mockDriverTrip.waypoints.length} Stops
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Vehicle #{mockDriverTrip.regNumber} · Seal #{mockDriverTrip.sealNumber}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Driver Details */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pilot:</span>
                  <strong className="text-foreground">
                    {mockDriverTrip.driver.name}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License:</span>
                  <span className="font-heading font-semibold text-[11px]">
                    {mockDriverTrip.driver.licenseId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shift Rollout:</span>
                  <span className="font-semibold text-foreground">
                    {mockDriverTrip.plannedDepartureTime}
                  </span>
                </div>
              </div>

              {/* Waypoints Fast Jump */}
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground px-1">
                  Route Waypoints
                </h4>
                {mockDriverTrip.waypoints.map((wp) => (
                  <button
                    key={wp.seq}
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      navigate(`/driver/active?wp=${wp.seq}`);
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer",
                      wp.status === "completed"
                        ? "bg-emerald-500/5 border-emerald-500/30 text-muted-foreground"
                        : wp.status === "active"
                          ? "bg-primary/10 border-primary text-foreground font-bold shadow-xs"
                          : "bg-background border-border hover:bg-accent text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "size-5.5 rounded-md flex items-center justify-center font-heading font-black text-xs shrink-0",
                          wp.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : wp.status === "active"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {wp.seq}
                      </span>
                      <span className="truncate">{wp.outletName}</span>
                    </div>
                    {wp.status === "completed" && (
                      <CheckCircleIcon
                        className="size-4 text-emerald-600 shrink-0"
                        weight="fill"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* 5. Add Break Confirmation Modal */}
        <Sheet open={isBreakModalOpen} onOpenChange={setIsBreakModalOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-4 bg-card">
            <SheetHeader className="pb-3 text-left">
              <SheetTitle className="font-heading font-black text-base text-foreground flex items-center gap-2">
                <CoffeeIcon className="size-5 text-primary" weight="bold" />
                <span>Log Driver Rest Break</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Vehicle telemetry status will pause active stop countdowns.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOnBreak(true);
                    setIsBreakModalOpen(false);
                  }}
                  className="h-10 rounded-xl font-bold flex flex-col justify-center"
                >
                  <span>15 Mins</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Quick Rest
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOnBreak(true);
                    setIsBreakModalOpen(false);
                  }}
                  className="h-10 rounded-xl font-bold flex flex-col justify-center"
                >
                  <span>30 Mins</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Meal Break
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOnBreak(true);
                    setIsBreakModalOpen(false);
                  }}
                  className="h-10 rounded-xl font-bold flex flex-col justify-center"
                >
                  <span>45 Mins</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Mandatory
                  </span>
                </Button>
              </div>

              <Button
                variant="default"
                onClick={() => {
                  setIsOnBreak(true);
                  setIsBreakModalOpen(false);
                }}
                className="w-full h-10 rounded-xl font-bold text-xs cursor-pointer"
              >
                Start Active Break Timer
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

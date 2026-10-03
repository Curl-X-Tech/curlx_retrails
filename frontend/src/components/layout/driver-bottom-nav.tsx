import { useNavigate, useLocation } from "react-router-dom";
import {
  HouseIcon,
  NavigationArrowIcon,
  ListBulletsIcon,
  TruckIcon,
  UserCircleIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOfflineActiveTrip } from "@/features/driver/hooks/use-offline-trip";
import { cn } from "@/lib/utils";

export interface DriverBottomNavProps {
  syncState: string;
}

export function DriverBottomNav({ syncState }: DriverBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { route } = useOfflineActiveTrip();

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
    <nav className="h-14 shrink-0 bg-background border-t border-border/80 grid grid-cols-4 px-2 z-30 shadow-lg">
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
        <span className="text-[10px]">Stops ({route?.waypoints.length || 0})</span>
      </button>

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
              {user?.name || route?.trip.driver?.name || "Driver"}
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
  );
}

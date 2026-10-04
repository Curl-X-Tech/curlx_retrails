import { useNavigate } from "react-router-dom";
import {
  SquaresFourIcon,
  ListBulletsIcon,
  WarningOctagonIcon,
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
import { cn } from "@/lib/utils";

export interface LoaderBottomNavProps {
  isDashboardActive?: boolean;
  isManifestsActive: boolean;
  isBaysActive?: boolean;
  isExceptionsActive?: boolean;
}

export function LoaderBottomNav({
  isDashboardActive,
  isManifestsActive,
  isExceptionsActive,
}: LoaderBottomNavProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav className="md:hidden h-14 shrink-0 bg-background/95 backdrop-blur-md border-t border-border grid grid-cols-4 px-1 z-40 shadow-lg select-none">
      <button
        onClick={() => navigate("/loader/dashboard")}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
          isDashboardActive
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground font-medium"
        )}
      >
        <SquaresFourIcon
          className="size-5"
          weight={isDashboardActive ? "fill" : "bold"}
        />
        <span className="text-[10px]">Dashboard</span>
      </button>

      <button
        onClick={() => navigate("/loader/manifests")}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
          isManifestsActive
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground font-medium"
        )}
      >
        <ListBulletsIcon
          className="size-5"
          weight={isManifestsActive ? "fill" : "bold"}
        />
        <span className="text-[10px]">Manifests</span>
      </button>

      <button
        onClick={() => navigate("/loader/exceptions")}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
          isExceptionsActive
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground font-medium"
        )}
      >
        <WarningOctagonIcon
          className="size-5"
          weight={isExceptionsActive ? "fill" : "bold"}
        />
        <span className="text-[10px]">Exceptions</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground cursor-pointer">
          <UserCircleIcon className="size-5.5" />
          <span className="text-[10px] font-medium">Account</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="w-56 p-1.5 shadow-lg rounded-xl mb-2"
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
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="text-destructive focus:text-destructive cursor-pointer text-xs font-semibold p-2 rounded-lg gap-2"
          >
            <SignOutIcon className="size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

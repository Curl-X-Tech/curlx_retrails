import { useNavigate } from "react-router-dom";
import {
  SquaresFourIcon,
  UserCircleIcon,
  ListBulletsIcon,
  WarningOctagonIcon,
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
import { cn } from "@/lib/utils";

export interface LoaderSidebarProps {
  isDashboardActive?: boolean;
  isManifestsActive: boolean;
  isBaysActive?: boolean;
  isExceptionsActive?: boolean;
}

export function LoaderSidebar({
  isDashboardActive,
  isManifestsActive,
  isExceptionsActive,
}: LoaderSidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col items-center justify-between border-r border-border/80 bg-sidebar py-3 w-16 shrink-0 z-30 select-none">
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex size-10 items-center justify-center rounded-xl bg-card border border-border/60 shadow-xs overflow-hidden p-1.5">
          <img src="/icon.png" alt="ReTrails Logo" className="size-full object-contain" />
        </div>

        <Separator className="w-8 bg-border/60" />

        <nav className="flex flex-col items-center gap-2 w-full px-2">
          <button
            onClick={() => navigate("/loader/dashboard")}
            title="Loader Command Dashboard"
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl transition-all cursor-pointer shadow-xs",
              isDashboardActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <SquaresFourIcon className="size-5.5" weight="bold" />
          </button>

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

          <button
            onClick={() => navigate("/loader/exceptions")}
            title="Discrepancies & Exceptions"
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl transition-all cursor-pointer shadow-xs",
              isExceptionsActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <WarningOctagonIcon className="size-5.5" weight="bold" />
          </button>
        </nav>
      </div>

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
  );
}

import { useNavigate } from "react-router-dom";
import { SignOutIcon, CaretRightIcon } from "@phosphor-icons/react";
import { SidebarFooter, SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";

export function SidebarUserComponent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2.5">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl p-2 hover:bg-sidebar-accent/80 transition-colors text-left cursor-pointer outline-none group"
                />
              }
            >
              <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "AD"}
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-xs leading-tight min-w-0 ml-1">
                    <span className="truncate font-semibold text-foreground text-[13px]">
                      {user?.name || "System User"}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground mt-0.5 capitalize">
                      {user?.role ? user.role.replace("_", " ") : "Staff"}
                    </span>
                  </div>
                  <CaretRightIcon className="ml-auto size-3.5 text-muted-foreground rotate-90" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60 rounded-xl p-1.5 shadow-lg"
              side="top"
              align="start"
              sideOffset={8}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal p-2">
                Signed in as{" "}
                <span className="font-semibold text-foreground block truncate">
                  {user?.email || "staff@curlx.tech"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assigned Role</span>
                <span className="font-bold text-foreground capitalize px-1.5 py-0.5 rounded bg-muted text-[11px]">
                  {user?.role ? user.role.replace("_", " ") : "Staff"}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="text-xs p-2 gap-2.5 rounded-lg text-destructive focus:text-destructive cursor-pointer font-semibold"
              >
                <SignOutIcon className="size-4" />
                <span>Log out of Console</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

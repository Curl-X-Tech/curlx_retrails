import { CaretUpDownIcon, WarehouseIcon, CheckIcon } from "@phosphor-icons/react";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HubInfo } from "./use-hub-options";
import { cn } from "@/lib/utils";

export interface SidebarHeaderComponentProps {
  isAdminRole: boolean;
  hubs: HubInfo[];
  activeHub: HubInfo | null;
  onSelectHub: (hub: HubInfo) => void;
}

export function SidebarHeaderComponent({
  isAdminRole,
  hubs,
  activeHub,
  onSelectHub,
}: SidebarHeaderComponentProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="border-b border-sidebar-border h-16 justify-center px-3.5">
      <div className="flex items-center justify-between w-full">
        {!isCollapsed ? (
          isAdminRole ? (
            <div className="flex items-center gap-3 p-1.5 -ml-1 min-w-0 flex-1">
              <div className="flex items-center justify-center size-10 rounded-xl bg-card border border-border/60 shadow-xs shrink-0 overflow-hidden p-1.5">
                <img
                  src="/icon.png"
                  alt="ReTrails Logo"
                  className="size-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-heading font-bold text-sm text-foreground tracking-tight truncate">
                  ReTrails Admin
                </span>
                <span className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  HQ Command Center
                </span>
              </div>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-3 p-1.5 -ml-1 rounded-xl hover:bg-sidebar-accent/80 transition-colors text-left min-w-0 flex-1 cursor-pointer outline-none"
                  />
                }
              >
                <div className="flex items-center justify-center size-10 rounded-xl bg-card border border-border/60 shadow-xs shrink-0 overflow-hidden p-1.5">
                  <img
                    src="/icon.png"
                    alt="ReTrails Logo"
                    className="size-full object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="font-heading font-bold text-sm text-foreground tracking-tight truncate">
                    ReTrails Logistics
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-1 mt-0.5">
                    {activeHub?.name ?? "No depot available"}
                    <CaretUpDownIcon className="size-3 shrink-0" />
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl p-1.5 shadow-lg"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Select Operating Hub
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hubs.map((hub) => {
                  const isSelected = activeHub?.id === hub.id;
                  return (
                    <DropdownMenuItem
                      key={hub.id}
                      onClick={() => onSelectHub(hub)}
                      className={cn(
                        "flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="size-4 shrink-0" />
                        <div className="flex flex-col">
                          <span>{hub.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {hub.province}
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckIcon className="size-4" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        ) : (
          <div className="flex items-center justify-center size-10 rounded-xl bg-card border border-border/60 mx-auto shadow-xs overflow-hidden p-1.5">
            <img
              src="/icon.png"
              alt="ReTrails Logo"
              className="size-full object-contain"
            />
          </div>
        )}
      </div>
    </SidebarHeader>
  );
}

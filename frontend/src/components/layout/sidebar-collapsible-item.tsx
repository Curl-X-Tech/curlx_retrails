import { CaretRightIcon } from "@phosphor-icons/react";
import {
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { NavItem, SubNavItem } from "./sidebar-types";

export interface SidebarCollapsibleItemProps {
  item: NavItem;
  isActive: boolean;
  isSubItemActive: (sub: SubNavItem) => boolean;
  onNavigate: (path?: string, id?: string) => void;
}

export function SidebarCollapsibleItem({
  item,
  isActive,
  isSubItemActive,
  onNavigate,
}: SidebarCollapsibleItemProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                "shrink-0 transition-transform duration-200 group-hover/collapsible:scale-110",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="truncate text-xs tracking-tight">{item.title}</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-bold rounded-md leading-none",
                    item.badgeVariant === "warning"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : item.badgeVariant === "info"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}
              <CaretRightIcon className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </div>
          )}
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <SidebarMenuSub className="my-1 ml-3.5 pl-3 border-l-2 border-border/60 gap-1">
              {item.items?.map((subItem) => {
                const subActive = isSubItemActive(subItem);
                return (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton
                      isActive={subActive}
                      className={cn(
                        "w-full rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                        subActive
                          ? "bg-sidebar-accent/70 text-primary font-bold"
                          : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
                      )}
                      onClick={() => onNavigate(subItem.path, subItem.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{subItem.title}</span>
                        {subItem.badge !== undefined && (
                          <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-muted text-muted-foreground rounded">
                            {subItem.badge}
                          </span>
                        )}
                      </div>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

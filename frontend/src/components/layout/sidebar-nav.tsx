import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem, SubNavItem } from "./sidebar-types";
import { SidebarCollapsibleItem } from "./sidebar-collapsible-item";

export interface SidebarNavComponentProps {
  navGroups: NavGroup[];
  isItemActive: (item: NavItem) => boolean;
  isSubItemActive: (sub: SubNavItem) => boolean;
  onNavigate: (path?: string, id?: string) => void;
}

export function SidebarNavComponent({
  navGroups,
  isItemActive,
  isSubItemActive,
  onNavigate,
}: SidebarNavComponentProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarContent className="px-2 py-3 gap-4">
      {navGroups.map((group, groupIdx) => (
        <SidebarGroup key={groupIdx} className="p-0">
          {group.label && !isCollapsed && (
            <SidebarGroupLabel className="px-3.5 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase mb-1">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const hasSubItems = item.items && item.items.length > 0;
                const active = isItemActive(item);

                if (hasSubItems) {
                  return (
                    <SidebarCollapsibleItem
                      key={item.id}
                      item={item}
                      isActive={active}
                      isSubItemActive={isSubItemActive}
                      onNavigate={onNavigate}
                    />
                  );
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      className={cn(
                        "w-full justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-2xs"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      onClick={() => onNavigate(item.path, item.id)}
                    >
                      <div className="flex items-center justify-between w-full min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "shrink-0 transition-transform duration-200",
                              active ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <span className="truncate text-xs tracking-tight">
                              {item.title}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && item.badge !== undefined && (
                          <SidebarMenuBadge
                            className={cn(
                              "px-1.5 py-0.5 text-[10px] font-bold rounded-md leading-none ml-auto",
                              item.badgeVariant === "warning"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : item.badgeVariant === "info"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

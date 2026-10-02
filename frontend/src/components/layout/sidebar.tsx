import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SquaresFourIcon,
  TrayIcon,
  ChartBarIcon,
  WarningOctagonIcon,
  NavigationArrowIcon,
  TruckIcon,
  StorefrontIcon,
  TrendUpIcon,
  FileTextIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  SignOutIcon,
  WarehouseIcon,
  CheckIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { MOCK_HUBS, type HubInfo } from "@/data/mock-hubs";

export interface SubNavItem {
  title: string;
  id: string;
  path: string;
  badge?: string | number;
}

export interface NavItem {
  title: string;
  id: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "destructive" | "info";
  items?: SubNavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ------------------------------------------------------------
// 1. Role-Based Navigation Configurations
// ------------------------------------------------------------

export const adminNavGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "admin-dashboard",
        path: "/admin/dashboard",
        icon: <SquaresFourIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Master Domain",
    items: [
      {
        title: "Retail Outlets",
        id: "admin-outlets",
        path: "/admin/outlets",
        icon: <StorefrontIcon weight="duotone" className="size-5" />,
        badge: 120,
      },
      {
        title: "Distribution Hubs",
        id: "admin-depots",
        path: "/admin/depots",
        icon: <WarehouseIcon weight="duotone" className="size-5" />,
        badge: 2,
      },
      {
        title: "Catalog & SKUs",
        id: "admin-items",
        path: "/admin/items",
        icon: <TrayIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Calendar & Surges",
        id: "admin-calendar",
        path: "/admin/calendar",
        icon: <TrendUpIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Personnel & Access",
    items: [
      {
        title: "Staff & Users",
        id: "admin-users",
        path: "/admin/users",
        icon: <UsersIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

export const dispatcherNavGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "dashboard",
        path: "/dispatcher/dashboard",
        icon: <SquaresFourIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Order queue",
        id: "order-queue",
        path: "/dispatcher/orders",
        icon: <TrayIcon weight="duotone" className="size-5" />,
        badge: 14,
      },
      {
        title: "Allocation",
        id: "allocation",
        path: "/dispatcher/allocations",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "Summary",
            id: "allocation-summary",
            path: "/dispatcher/allocations",
          },
          {
            title: "Detail",
            id: "allocation-detail",
            path: "/dispatcher/allocations/alloc-01",
          },
        ],
      },
      {
        title: "Deferrals",
        id: "deferrals",
        path: "/dispatcher/deferrals/carryover",
        icon: <WarningOctagonIcon weight="duotone" className="size-5" />,
        badge: 4,
        badgeVariant: "warning",
        items: [
          {
            title: "Carryover",
            id: "carryover",
            path: "/dispatcher/deferrals/carryover",
            badge: 4,
          },
          {
            title: "Deferral log",
            id: "deferral-log",
            path: "/dispatcher/deferrals/audit-log",
          },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Live Tracking",
        id: "live-tracking",
        path: "/dispatcher/live-map",
        icon: <NavigationArrowIcon weight="duotone" className="size-5" />,
        badge: "Live",
        badgeVariant: "info",
      },
      {
        title: "Fleet",
        id: "fleet",
        path: "/dispatcher/fleet/vehicles",
        icon: <TruckIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "Vehicles",
            id: "vehicles",
            path: "/dispatcher/fleet/vehicles",
          },
          {
            title: "Workshop log",
            id: "workshop-log",
            path: "/dispatcher/fleet/workshop-log",
          },
          {
            title: "Fuel quotas",
            id: "fuel-quotas",
            path: "/dispatcher/fleet/fuel-quotas",
          },
        ],
      },
      {
        title: "Outlets",
        id: "outlets",
        path: "/dispatcher/outlets",
        icon: <StorefrontIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Trip metrics",
        id: "trip-metrics",
        path: "/dispatcher/analytics/trips",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Sustainability",
        id: "sustainability",
        path: "/dispatcher/analytics/sustainability",
        icon: <TrendUpIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

export const storeNavGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "dashboard",
        path: "/store/dashboard",
        icon: <SquaresFourIcon weight="duotone" className="size-5" />,
        items: [
          {
            title: "System alerts",
            id: "system-alerts",
            path: "/store/dashboard",
          },
        ],
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Order queue",
        id: "order-queue",
        path: "/store/orders",
        icon: <TrayIcon weight="duotone" className="size-5" />,
        badge: 24,
      },
      {
        title: "New order",
        id: "new-order",
        path: "/store/orders/new",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Deferrals",
        id: "deferrals",
        path: "/store/deferrals/unserved",
        icon: <WarningOctagonIcon weight="duotone" className="size-5" />,
        badge: 3,
        badgeVariant: "warning",
        items: [
          {
            title: "Un served queue",
            id: "unserved-queue",
            path: "/store/deferrals/unserved",
            badge: 3,
          },
          {
            title: "Deferral log",
            id: "deferral-log",
            path: "/store/deferrals/log",
          },
          {
            title: "Carryover",
            id: "carryover",
            path: "/store/deferrals/carryover",
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        title: "Reports",
        id: "reports",
        path: "/store/reports",
        icon: <FileTextIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

// ------------------------------------------------------------
// 2. Main Dynamic Sidebar Component
// ------------------------------------------------------------

interface AppSidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  customNavGroups?: NavGroup[];
}

export function AppSidebar({ activeId, onSelect, customNavGroups }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [activeHub, setActiveHub] = React.useState<HubInfo>(MOCK_HUBS[0]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine active nav groups dynamically based on route / role
  const isAdminRole =
    user?.role === "system_admin" || location.pathname.startsWith("/admin");
  const isStoreRole =
    user?.role === "store_manager" || location.pathname.startsWith("/store");

  const resolvedNavGroups =
    customNavGroups ||
    (isAdminRole ? adminNavGroups : isStoreRole ? storeNavGroups : dispatcherNavGroups);

  const isSubItemActive = (sub: SubNavItem) => {
    if (activeId) return activeId === sub.id;
    if (sub.id === "system-alerts") {
      return (
        location.pathname === "/store/dashboard" || location.pathname === "/store/alerts"
      );
    }
    if (sub.id === "unserved-queue") {
      return (
        location.pathname === "/store/deferrals/unserved" ||
        (location.pathname === "/store/deferrals" && location.search.includes("unserved"))
      );
    }
    if (sub.id === "deferral-log") {
      return (
        location.pathname === "/store/deferrals/log" ||
        location.pathname === "/dispatcher/deferrals/audit-log" ||
        location.pathname === "/dispatcher/deferrals/deferral-log"
      );
    }
    if (sub.id === "carryover") {
      return (
        location.pathname === "/store/deferrals/carryover" ||
        location.pathname === "/dispatcher/deferrals/carryover" ||
        location.pathname === "/dispatcher/deferrals"
      );
    }
    if (sub.id === "order-queue") {
      return (
        location.pathname === "/dispatcher/orders" ||
        location.pathname === "/dispatcher/orders/" ||
        location.pathname === "/store/orders" ||
        location.pathname === "/store/orders/" ||
        location.pathname === "/store/queue"
      );
    }
    if (sub.id === "allocation-summary") {
      return (
        location.pathname === "/dispatcher/allocations" ||
        location.pathname === "/dispatcher/allocations/"
      );
    }
    if (sub.id === "allocation-detail") {
      return (
        location.pathname.startsWith("/dispatcher/allocations/") &&
        location.pathname !== "/dispatcher/allocations" &&
        location.pathname !== "/dispatcher/allocations/"
      );
    }
    return location.pathname === sub.path;
  };

  const isItemActive = (item: NavItem) => {
    if (activeId) {
      if (activeId === item.id) return true;
      if (item.items?.some((sub) => sub.id === activeId)) return true;
    }
    if (item.items && item.items.length > 0) {
      return item.items.some((sub) => isSubItemActive(sub));
    }
    if (item.path) {
      if (item.id === "admin-dashboard") {
        return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
      }
      if (item.id === "live-tracking") {
        return (
          location.pathname === "/dispatcher/live-map" ||
          location.pathname === "/dispatcher/live-tracking"
        );
      }
      return (
        location.pathname === item.path || location.pathname.startsWith(item.path + "/")
      );
    }
    return false;
  };

  const handleNavigate = (path?: string, id?: string) => {
    if (id) {
      onSelect?.(id);
    }
    if (path) {
      navigate(path);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border font-sans bg-sidebar select-none"
    >
      {/* 1. Header: Dynamic for Admin HQ vs Hub Staging */}
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
                      {activeHub.name}
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
                  {MOCK_HUBS.map((hub) => {
                    const isSelected = activeHub.id === hub.id;
                    return (
                      <DropdownMenuItem
                        key={hub.id}
                        onClick={() => setActiveHub(hub)}
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

      {/* 2. Navigation Content Body */}
      <SidebarContent className="px-2 py-3 gap-4">
        {resolvedNavGroups.map((group, groupIdx) => (
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
                      <Collapsible
                        key={item.id}
                        defaultOpen={active}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  "shrink-0 transition-transform duration-200 group-hover/collapsible:scale-110",
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
                                        onClick={() =>
                                          handleNavigate(subItem.path, subItem.id)
                                        }
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="truncate">
                                            {subItem.title}
                                          </span>
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
                        onClick={() => handleNavigate(item.path, item.id)}
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

      {/* 3. User Profile Footer with Clean Logout */}
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
      <SidebarRail />
    </Sidebar>
  );
}

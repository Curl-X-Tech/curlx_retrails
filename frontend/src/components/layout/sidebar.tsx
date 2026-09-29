import * as React from "react";
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
  BellIcon,
  SignOutIcon,
  UserIcon,
  GearSixIcon,
  WarehouseIcon,
  CheckIcon,
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface SubNavItem {
  title: string;
  id: string;
  badge?: string | number;
}

export interface NavItem {
  title: string;
  id: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "destructive" | "info";
  items?: SubNavItem[];
}

export const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        title: "Dashboard",
        id: "dashboard",
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
        icon: <TrayIcon weight="duotone" className="size-5" />,
        badge: 14,
      },
      {
        title: "Allocation summary",
        id: "allocation-summary",
        icon: <ChartBarIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Deferrals",
        id: "deferrals",
        icon: <WarningOctagonIcon weight="duotone" className="size-5" />,
        badge: "3",
        badgeVariant: "warning",
        items: [
          { title: "Unserved queue", id: "unserved-queue", badge: 3 },
          { title: "Deferral log", id: "deferral-log" },
          { title: "Carryover", id: "carryover" },
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
        icon: <NavigationArrowIcon weight="duotone" className="size-5" />,
        badge: "Live",
        badgeVariant: "info",
      },
      {
        title: "Fleet",
        id: "fleet",
        icon: <TruckIcon weight="duotone" className="size-5" />,
        items: [
          { title: "Vehicles", id: "vehicles" },
          { title: "Workshop log", id: "workshop-log" },
          { title: "Fuel quotas", id: "fuel-quotas" },
        ],
      },
      {
        title: "Outlets",
        id: "outlets",
        icon: <StorefrontIcon weight="duotone" className="size-5" />,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Forecasts",
        id: "forecasts",
        icon: <TrendUpIcon weight="duotone" className="size-5" />,
      },
      {
        title: "Reports",
        id: "reports",
        icon: <FileTextIcon weight="duotone" className="size-5" />,
      },
    ],
  },
];

const hubs = [
  { id: "h1", name: "Peliyagoda Central Hub", sector: "Western Province", active: true },
  { id: "h2", name: "Kandy Regional Depot", sector: "Central Province", active: false },
  { id: "h3", name: "Galle Southern Depot", sector: "Southern Province", active: false },
];

interface AppSidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function AppSidebar({ activeId = "dashboard", onSelect }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [activeHub, setActiveHub] = React.useState(hubs[0]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border font-sans bg-sidebar select-none"
    >
      {/* Workspace Hub Header */}
      <SidebarHeader className="border-b border-sidebar-border h-16 justify-center px-3.5">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-3 p-1.5 -ml-1 rounded-xl hover:bg-sidebar-accent/80 transition-colors text-left min-w-0 flex-1 cursor-pointer outline-none"
                  />
                }
              >
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-xs shrink-0">
                  <WarehouseIcon weight="bold" className="size-5" />
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
                className="w-64 rounded-xl p-1.5 shadow-lg"
                align="start"
                sideOffset={6}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1">
                  Active Distribution Hubs
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {hubs.map((hub) => (
                    <DropdownMenuItem
                      key={hub.id}
                      onClick={() => setActiveHub(hub)}
                      className="text-xs p-2 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{hub.name}</p>
                        <p className="text-[10px] text-muted-foreground">{hub.sector}</p>
                      </div>
                      {hub.id === activeHub.id && (
                        <CheckIcon className="size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-xs mx-auto">
              RX
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2.5 py-3 space-y-3">
        {navGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-0.5">
            {group.label && !isCollapsed && (
              <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const hasSubItems = item.items && item.items.length > 0;
                  const isCurrentActive =
                    activeId === item.id ||
                    item.items?.some((sub) => sub.id === activeId);

                  if (hasSubItems) {
                    if (isCollapsed) {
                      return (
                        <SidebarMenuItem key={item.id}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <SidebarMenuButton
                                  isActive={isCurrentActive}
                                  className="h-10 text-[13.5px] font-medium justify-center w-full px-0 rounded-xl cursor-pointer"
                                />
                              }
                            >
                              <span
                                className={cn(
                                  isCurrentActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.icon}
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              sideOffset={8}
                              className="w-52 rounded-xl p-1.5 shadow-lg"
                            >
                              <DropdownMenuLabel className="text-xs font-semibold text-foreground px-2 py-1 flex items-center justify-between">
                                <span>{item.title}</span>
                                {item.badge && (
                                  <Badge
                                    variant={item.badgeVariant || "secondary"}
                                    className="h-4 px-1.5 text-[10px] font-semibold"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                {item.items?.map((sub) => {
                                  const isSubActive = activeId === sub.id;
                                  return (
                                    <DropdownMenuItem
                                      key={sub.id}
                                      onClick={() => onSelect?.(sub.id)}
                                      className={cn(
                                        "text-xs p-2 rounded-lg flex items-center justify-between cursor-pointer",
                                        isSubActive &&
                                          "bg-primary/10 text-primary font-semibold"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full shrink-0",
                                            isSubActive
                                              ? "bg-primary"
                                              : "bg-muted-foreground/60"
                                          )}
                                        />
                                        <span className="truncate">{sub.title}</span>
                                      </div>
                                      {sub.badge && (
                                        <Badge
                                          variant="destructive"
                                          className="h-4 px-1.5 text-[10px] font-semibold shrink-0"
                                        >
                                          {sub.badge}
                                        </Badge>
                                      )}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={item.id}
                        defaultOpen={item.id === "deferrals"}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger
                            render={
                              <SidebarMenuButton
                                isActive={isCurrentActive}
                                className="h-10 text-[13.5px] font-medium justify-between w-full px-3 rounded-xl cursor-pointer group/trigger"
                              />
                            }
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  isCurrentActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.icon}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge && (
                                <Badge
                                  variant={item.badgeVariant || "secondary"}
                                  className="h-5 px-2 text-[11px] font-semibold"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              <CaretRightIcon className="size-3.5 text-muted-foreground transition-transform duration-200 ease-in-out group-data-[panel-open]/collapsible:rotate-90 group-data-[open]/collapsible:rotate-90 group-aria-expanded/collapsible:rotate-90 group-data-[panel-open]/trigger:rotate-90 group-aria-expanded/trigger:rotate-90" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="my-1.5 pl-6 ml-3.5 !border-l-0 !border-transparent relative space-y-1">
                              {item.items?.map((sub) => {
                                const isSubActive = activeId === sub.id;
                                return (
                                  <SidebarMenuSubItem
                                    key={sub.id}
                                    className="relative flex items-center"
                                  >
                                    {/* Discrete thick, darker dashed L-shape connector with corner radius */}
                                    <div className="absolute -left-3.5 top-0 h-1/2 w-3.5 border-l-2 border-b-2 border-dashed border-neutral-400 rounded-bl-[4px] pointer-events-none" />

                                    <SidebarMenuSubButton
                                      isActive={isSubActive}
                                      onClick={() => onSelect?.(sub.id)}
                                      className={cn(
                                        "h-9 text-[13px] rounded-lg px-2.5 cursor-pointer justify-between transition-colors w-full",
                                        isSubActive
                                          ? "bg-primary/10 text-primary font-semibold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full shrink-0",
                                            isSubActive
                                              ? "bg-primary"
                                              : "bg-muted-foreground/60"
                                          )}
                                        />
                                        <span className="truncate">{sub.title}</span>
                                      </div>
                                      {sub.badge && (
                                        <Badge
                                          variant="destructive"
                                          className="h-4 px-1.5 text-[10px] font-semibold shrink-0"
                                        >
                                          {sub.badge}
                                        </Badge>
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isCurrentActive}
                        onClick={() => onSelect?.(item.id)}
                        className={cn(
                          "h-10 text-[13.5px] font-medium cursor-pointer px-3 rounded-xl transition-colors",
                          isCurrentActive &&
                            "bg-primary/10 text-primary font-bold shadow-xs"
                        )}
                      >
                        <span
                          className={cn(
                            isCurrentActive ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="right-2">
                          <Badge
                            variant={
                              item.badgeVariant ||
                              (isCurrentActive ? "outline" : "secondary")
                            }
                            className="h-5 px-2 text-[11px] font-semibold"
                          >
                            {item.badge}
                          </Badge>
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer Profile Dropdown */}
      <SidebarFooter className="border-t border-sidebar-border p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-13 rounded-xl px-2.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full hover:bg-sidebar-accent transition-colors cursor-pointer"
                  />
                }
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-xs shrink-0 border border-primary/20">
                  KJ
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight min-w-0 ml-1">
                  <span className="truncate font-semibold text-foreground text-[13px]">
                    K. Jayawardena
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground mt-0.5">
                    Lead Dispatcher
                  </span>
                </div>
                <CaretRightIcon className="ml-auto size-3.5 text-muted-foreground rotate-90" />
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
                    k.jayawardena@curlx.lk
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-xs p-2 gap-2.5 rounded-lg cursor-pointer">
                    <UserIcon className="size-4 text-muted-foreground" />
                    Profile & Role Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs p-2 gap-2.5 rounded-lg cursor-pointer">
                    <BellIcon className="size-4 text-muted-foreground" />
                    Notification Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs p-2 gap-2.5 rounded-lg cursor-pointer">
                    <GearSixIcon className="size-4 text-muted-foreground" />
                    Dispatch Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs p-2 gap-2.5 rounded-lg text-destructive focus:text-destructive cursor-pointer">
                  <SignOutIcon className="size-4" />
                  Log out of Console
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

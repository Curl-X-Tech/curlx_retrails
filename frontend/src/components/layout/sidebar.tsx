import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { useHubOptions, type HubInfo } from "./use-hub-options";
import {
  adminNavGroups,
  dispatcherNavGroups,
  storeNavGroups,
  type NavGroup,
  type NavItem,
  type SubNavItem,
} from "./sidebar-constants";
import { SidebarHeaderComponent } from "./sidebar-header";
import { SidebarNavComponent } from "./sidebar-nav";
import { SidebarUserComponent } from "./sidebar-user";

export * from "./sidebar-constants";
export { SidebarHeaderComponent } from "./sidebar-header";
export { SidebarNavComponent } from "./sidebar-nav";
export { SidebarUserComponent } from "./sidebar-user";

export interface AppSidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  customNavGroups?: NavGroup[];
}

export function AppSidebar({ activeId, onSelect, customNavGroups }: AppSidebarProps) {
  const { hubs } = useHubOptions();
  const [selectedHub, setActiveHub] = React.useState<HubInfo | null>(null);
  const activeHub = selectedHub ?? hubs[0] ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      <SidebarHeaderComponent
        isAdminRole={isAdminRole}
        hubs={hubs}
        activeHub={activeHub}
        onSelectHub={setActiveHub}
      />
      <SidebarNavComponent
        navGroups={resolvedNavGroups}
        isItemActive={isItemActive}
        isSubItemActive={isSubItemActive}
        onNavigate={handleNavigate}
      />
      <SidebarUserComponent />
      <SidebarRail />
    </Sidebar>
  );
}

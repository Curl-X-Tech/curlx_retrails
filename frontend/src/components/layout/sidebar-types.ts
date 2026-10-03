import * as React from "react";

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

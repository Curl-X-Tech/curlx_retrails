import type { StaffRole } from "@/types/domain";

export type AppSubdomainMode =
  "dispatcher" | "loader" | "driver" | "system_admin" | "store_manager" | "unified";

const SUBDOMAIN_ROLE_MAP: Record<string, StaffRole> = {
  dis: "dispatcher",
  dispatcher: "dispatcher",
  dispatch: "dispatcher",
  load: "loader",
  loader: "loader",
  loading: "loader",
  drv: "driver",
  driver: "driver",
  drivers: "driver",
  adm: "system_admin",
  admin: "system_admin",
  str: "store_manager",
  store: "store_manager",
  stores: "store_manager",
};

export function getRoleFromHostname(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : ""
): StaffRole | null {
  if (!hostname) return null;

  const parts = hostname.toLowerCase().split(".");
  if (parts.length >= 2) {
    const firstPart = parts[0];
    if (SUBDOMAIN_ROLE_MAP[firstPart]) {
      return SUBDOMAIN_ROLE_MAP[firstPart];
    }
  }

  return null;
}

export function getActiveDomainRole(): StaffRole | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const queryRole = params.get("app") || params.get("role");
  if (queryRole && SUBDOMAIN_ROLE_MAP[queryRole.toLowerCase()]) {
    return SUBDOMAIN_ROLE_MAP[queryRole.toLowerCase()];
  }

  return getRoleFromHostname(window.location.hostname);
}

export function getRoleHomePath(role: StaffRole): string {
  switch (role) {
    case "dispatcher":
      return "/dispatcher/allocations";
    case "loader":
      return "/loader/bays";
    case "driver":
      return "/driver/trips";
    case "system_admin":
      return "/admin/dashboard";
    case "store_manager":
      return "/store/orders";
    default:
      return "/";
  }
}

export function getRoleRootPrefix(role: StaffRole): string {
  switch (role) {
    case "dispatcher":
      return "/dispatcher";
    case "loader":
      return "/loader";
    case "driver":
      return "/driver";
    case "system_admin":
      return "/admin";
    case "store_manager":
      return "/store";
    default:
      return "";
  }
}

import type {
  UserSortKey,
  OutletSortKey,
  ItemSortKey,
  CalendarSortKey,
  MasterOutlet,
  MasterItem,
  CalendarDay,
} from "./types";
import type { MockUserWithMeta } from "@/features/admin/types";

export function sortUsers(
  users: MockUserWithMeta[],
  sortKey: UserSortKey | null,
  sortDirection: "asc" | "desc"
): MockUserWithMeta[] {
  if (!sortKey) return users;
  return [...users].sort((a, b) => {
    let valA: string | number = "";
    let valB: string | number = "";
    if (sortKey === "status") {
      valA = a.is_active ? 1 : 0;
      valB = b.is_active ? 1 : 0;
    } else if (sortKey === "created_at") {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    } else {
      valA = String(a[sortKey as keyof MockUserWithMeta] ?? "").toLowerCase();
      valB = String(b[sortKey as keyof MockUserWithMeta] ?? "").toLowerCase();
    }
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

export function sortOutlets(
  outlets: MasterOutlet[],
  sortKey: OutletSortKey | null,
  sortDirection: "asc" | "desc",
  getBrandCode: (id: string) => string,
  getDistrictName: (id: string) => string
): MasterOutlet[] {
  if (!sortKey) return outlets;
  return [...outlets].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "outletId") cmp = a.outlet_id.localeCompare(b.outlet_id);
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "brand")
      cmp = getBrandCode(a.brand_id).localeCompare(getBrandCode(b.brand_id));
    else if (sortKey === "district")
      cmp = getDistrictName(a.district_id).localeCompare(getDistrictName(b.district_id));
    else if (sortKey === "dock") cmp = a.dock_type.localeCompare(b.dock_type);
    else if (sortKey === "constraint")
      cmp = (a.parking_constraint || "").localeCompare(b.parking_constraint || "");
    else if (sortKey === "window")
      cmp = a.window_open_time.localeCompare(b.window_open_time);
    return sortDirection === "asc" ? cmp : -cmp;
  });
}

export function sortItems(
  items: MasterItem[],
  sortKey: ItemSortKey | null,
  sortDirection: "asc" | "desc",
  getBrandCode: (id: string) => string,
  getActivePrice: (id: string) => number | null
): MasterItem[] {
  if (!sortKey) return items;
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "sku") cmp = a.sku.localeCompare(b.sku);
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "brand")
      cmp = getBrandCode(a.brand_id).localeCompare(getBrandCode(b.brand_id));
    else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
    else if (sortKey === "weight") cmp = a.unit_weight_kg - b.unit_weight_kg;
    else if (sortKey === "volume") cmp = a.unit_volume_m3 - b.unit_volume_m3;
    else if (sortKey === "price") {
      const priceA = getActivePrice(a.id) ?? 0;
      const priceB = getActivePrice(b.id) ?? 0;
      cmp = priceA - priceB;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });
}

export function sortCalendarDays(
  days: CalendarDay[],
  sortKey: CalendarSortKey | null,
  sortDirection: "asc" | "desc",
  getSurgeMultiplier: (date: string) => number
): CalendarDay[] {
  if (!sortKey) return days;
  return [...days].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "date") cmp = a.date.localeCompare(b.date);
    else if (sortKey === "dayOfWeek")
      cmp = (a.dow_name || "").localeCompare(b.dow_name || "");
    else if (sortKey === "operating")
      cmp = (a.is_operating ? 1 : 0) - (b.is_operating ? 1 : 0);
    else if (sortKey === "surge")
      cmp = getSurgeMultiplier(a.date) - getSurgeMultiplier(b.date);
    else if (sortKey === "monsoon") cmp = (a.monsoon ? 1 : 0) - (b.monsoon ? 1 : 0);
    return sortDirection === "asc" ? cmp : -cmp;
  });
}

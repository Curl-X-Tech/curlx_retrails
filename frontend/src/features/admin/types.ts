import type { Role } from "@/api/users";
import type {
  Depot,
  District,
  Brand,
  Outlet,
  Item,
  PriceList,
  ActivePrice,
  CalendarDay,
  DemandSurge,
} from "@/api/master";

export type {
  Depot as MasterDepot,
  District as MasterDistrict,
  Brand as MasterBrand,
  Outlet as MasterOutlet,
  Item as MasterItem,
  PriceList as MasterPrice,
  ActivePrice,
  CalendarDay,
  DemandSurge,
};

export type UserSortKey = "name" | "email" | "user_type" | "status" | "created_at";

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  user_type: Role;
  department: string;
  phone: string;
  location: string;
  is_active: boolean;
}

export type OutletSortKey =
  "outletId" | "name" | "brand" | "district" | "dock" | "constraint" | "window";

export type ItemSortKey =
  "sku" | "name" | "brand" | "category" | "weight" | "volume" | "price";

export type CalendarSortKey = "date" | "dayOfWeek" | "operating" | "surge" | "monsoon";

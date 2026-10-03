export type UserSortKey = "name" | "email" | "user_type" | "status" | "created_at";

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  user_type: string;
  department: string;
  phone: string;
  location: string;
  is_active: boolean;
}

export type OutletSortKey = "outletId" | "name" | "brand" | "district" | "dock" | "constraint" | "window";
export type ItemSortKey = "sku" | "name" | "brand" | "category" | "weight" | "volume" | "price";
export type CalendarSortKey = "date" | "dayOfWeek" | "operating" | "surge" | "monsoon";

export interface MasterDepot {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterDistrict {
  id: string;
  name: string;
  province: string;
  assigned_depot_id: string;
  created_at: string;
}

export interface MasterBrand {
  id: string;
  code: string;
  name: string;
  delivery_window_type: string;
  requires_cold_chain: boolean;
  daily_time_budget_min: number;
  created_at: string;
  updated_at: string;
}

export interface MasterOutlet {
  id: string;
  outlet_id: string;
  brand_id: string;
  district_id: string;
  depot_id: string;
  name: string;
  dock_type: "rear_dock" | "street" | "mall_bay";
  parking_constraint: "normal" | "van_only" | "mall_dock";
  mall_window: string | null;
  window_open_time: string;
  window_close_time: string;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterItem {
  id: string;
  sku: string;
  brand_id: string;
  name: string;
  category: string;
  unit: string;
  unit_weight_kg: number;
  unit_volume_m3: number;
  requires_cold_chain: boolean;
  special_handling_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemandSurge {
  date: string;
  dow_name: string;
  festival: string | null;
  festival_ramp: number;
  is_payday: boolean;
  monsoon: boolean;
  surge_multiplier: number;
}

export interface CalendarDay {
  date: string;
  dow: number;
  dow_name: string;
  is_weekend: boolean;
  iso_year: number;
  iso_week: number;
  is_payday: boolean;
  festival: string | null;
  festival_ramp: number;
  is_holiday: boolean;
  monsoon: boolean;
  is_operating: boolean;
  created_at: string;
}

export interface MasterPrice {
  id: string;
  item_id: string;
  cost_price: number;
  unit_price: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  price_change_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivePrice {
  price_list_id: string;
  item_id: string;
  sku: string;
  item_name: string;
  cost_price: number;
  unit_price: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  price_change_reason: string | null;
}

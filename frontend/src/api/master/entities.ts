export type DockType = "rear_dock" | "street" | "mall_bay";

export type ParkingConstraint = "normal" | "van_only" | "mall_dock";

export type SpecialHandlingCode = "COL" | "FRG" | "MAL" | "HAZ";

export type PriceChangeReason =
  "standard_pricing" | "festival_promo" | "supplier_revision" | "seasonal_adjustment";

export type BrandCode = "FRESH" | "STYLE" | "TECH";

export interface Depot {
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

export interface District {
  id: string;
  name: string;
  province: string;
  assigned_depot_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  code: BrandCode;
  name: string;
  delivery_window_type: string;
  requires_cold_chain: boolean;
  daily_time_budget_min: number;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  outlet_id: string;
  brand_id: string;
  district_id: string;
  depot_id: string;
  name: string;
  dock_type: DockType;
  parking_constraint: ParkingConstraint;
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

export interface Item {
  id: string;
  sku: string;
  brand_id: string;
  name: string;
  category: string;
  unit: string;
  unit_weight_kg: number;
  unit_volume_m3: number;
  requires_cold_chain: boolean;
  special_handling_code: SpecialHandlingCode | null;
  created_at: string;
  updated_at: string;
}

export interface PriceList {
  id: string;
  item_id: string;
  cost_price: number;
  unit_price: number;
  currency: "LKR";
  effective_from: string;
  effective_to: string | null;
  price_change_reason: PriceChangeReason | null;
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
  currency: "LKR";
  effective_from: string;
  effective_to: string | null;
  price_change_reason: PriceChangeReason | null;
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

export interface DemandSurge {
  date: string;
  dow_name: string;
  festival: string | null;
  festival_ramp: number;
  is_payday: boolean;
  monsoon: boolean;
  surge_multiplier: number;
}

import type {
  DockType,
  ParkingConstraint,
  PriceChangeReason,
  SpecialHandlingCode,
} from "./entities";

export interface QueryToggle {
  enabled?: boolean;
}

export interface DepotFilters {
  is_active?: boolean;
}

export interface OutletFilters {
  brand_id?: string;
  district_id?: string;
  depot_id?: string;
  dock_type?: DockType;
  parking_constraint?: ParkingConstraint;
  is_active?: boolean;
}

export interface ItemFilters {
  brand_id?: string;
  category?: string;
  requires_cold_chain?: boolean;
  special_handling_code?: SpecialHandlingCode;
}

export interface PriceFilters {
  item_id?: string;
  is_active?: boolean;
}

export interface OperatingDaysFilters {
  start_date?: string;
  days?: number;
}

export interface DateRange {
  from_date?: string;
  to_date?: string;
}

export interface CalendarRangeFilters extends DateRange {
  is_operating?: boolean;
  is_holiday?: boolean;
  festival?: string;
}

export interface OutletPayload {
  outlet_id: string;
  name: string;
  brand_id: string;
  district_id: string;
  depot_id: string;
  dock_type: DockType;
  parking_constraint: ParkingConstraint;
  mall_window?: string | null;
  window_open_time: string;
  window_close_time: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
  is_active?: boolean;
}

export type OutletUpdatePayload = Partial<OutletPayload>;

export interface ItemPayload {
  sku: string;
  brand_id: string;
  name: string;
  category: string;
  unit?: string;
  unit_weight_kg: number;
  unit_volume_m3: number;
  requires_cold_chain?: boolean;
  special_handling_code?: SpecialHandlingCode | null;
}

export type ItemUpdatePayload = Partial<ItemPayload>;

export interface PricePayload {
  item_id: string;
  cost_price?: number;
  unit_price?: number;
  currency?: "LKR";
  effective_from?: string;
  effective_to?: string | null;
  price_change_reason?: PriceChangeReason | null;
  is_active?: boolean;
}

export type PriceUpdatePayload = Partial<Omit<PricePayload, "item_id">>;

export interface DepotUpdatePayload {
  code?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  is_active?: boolean;
}

export interface CalendarDayUpdatePayload {
  is_payday?: boolean;
  festival?: string | null;
  festival_ramp?: number;
  is_holiday?: boolean;
  monsoon?: boolean;
  is_operating?: boolean;
}

export interface CalendarBulkGeneratePayload {
  from_date: string;
  to_date: string;
}

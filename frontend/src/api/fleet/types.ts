export type VehicleType = "truck" | "van";

export type VehicleTemp = "reefer" | "ambient";

export type VehicleStatus =
  "available" | "loading" | "in_transit" | "in_workshop" | "breakdown";

export interface Vehicle {
  id: string;
  vehicle_id: string;
  reg_number: string;
  model_name: string;
  type: VehicleType;
  temp: VehicleTemp;
  weight_cap_kg: number;
  volume_cap_m3: number;
  fuel_type: string;
  km_per_l: number;
  weekly_fuel_quota_l: number;
  consumed_fuel_l?: number;
  assigned_depot_id: string;
  assigned_driver_id?: string | null;
  status: VehicleStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  phone_number: string;
  assigned_depot_id: string;
  license_class?: string | null;
  safety_rating?: number;
  total_completed_trips?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VehicleFilters {
  depot_id?: string;
  type?: VehicleType;
  temp?: VehicleTemp;
  status?: VehicleStatus;
  is_active?: boolean;
}

export interface DriverFilters {
  depot_id?: string;
  is_active?: boolean;
}

export interface CreateVehiclePayload {
  reg_number: string;
  model_name: string;
  type: VehicleType;
  temp: VehicleTemp;
  weight_cap_kg: number;
  volume_cap_m3: number;
  fuel_type?: string;
  km_per_l: number;
  weekly_fuel_quota_l: number;
  assigned_depot_id: string;
  assigned_driver_id?: string | null;
  vehicle_id?: string;
}

export interface UpdateVehiclePayload {
  reg_number?: string;
  model_name?: string;
  type?: VehicleType;
  temp?: VehicleTemp;
  weight_cap_kg?: number;
  volume_cap_m3?: number;
  fuel_type?: string;
  km_per_l?: number;
  weekly_fuel_quota_l?: number;
  assigned_depot_id?: string;
  assigned_driver_id?: string | null;
  status?: VehicleStatus;
  is_active?: boolean;
}

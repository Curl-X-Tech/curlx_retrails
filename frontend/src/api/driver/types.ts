export type WaypointStatus = "pending" | "arrived" | "completed" | "skipped";

export type TripStatus =
  "scheduled" | "loading" | "dispatched" | "in_transit" | "completed" | "cancelled";

export interface CurrentRouteVehicle {
  id: string;
  reg_number: string;
  model_name: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weight_cap_kg: number;
  volume_cap_m3: number;
  fuel_type?: "diesel" | "petrol" | "electric";
  km_per_l?: number;
  weekly_fuel_quota_l?: number;
  fuel_remaining_l?: number;
  reefer_current_temp_c?: number;
  reefer_target_temp_c?: number;
}

export interface CurrentRouteDepot {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export interface CurrentRouteTripDriver {
  id: string;
  name: string;
  phone?: string;
  license_id?: string;
  designation?: string;
  avatar_initials?: string;
}

export interface CurrentRouteTrip {
  id: string;
  trip_code: string;
  status: TripStatus;
  dispatch_date: string;
  seal_number?: string;
  vehicle: CurrentRouteVehicle;
  depot: CurrentRouteDepot;
  driver?: CurrentRouteTripDriver;
}

export interface CurrentRouteOrderItem {
  id: string;
  order_id: string;
  order_ref: string;
  package_code: string;
  sku: string;
  item_title: string;
  category: string;
  crate_count: number;
  weight_kg: number;
  volume_m3: number;
  special_handling_code?: string | null;
  status: "pending" | "delivered" | "discrepancy";
}

export interface CurrentRouteWaypointOrderSummary {
  order_id: string;
  order_ref: string;
  total_weight_kg: number;
  total_crate_count: number;
  items: CurrentRouteOrderItem[];
}

export interface CurrentRouteWaypoint {
  id: string;
  route_leg_id: string;
  seq: number;
  outlet_id: string;
  outlet_name: string;
  address: string;
  lat: number;
  lng: number;
  contact_name: string;
  contact_number: string;
  access_constraints?: "van_only" | "mall_dock" | "normal" | "none" | string;
  dock_type?: "rear_dock" | "street" | "mall_bay" | string;
  delivery_window: string;
  status: WaypointStatus;
  arrived_at?: string | null;
  completed_at?: string | null;
  order_summary: CurrentRouteWaypointOrderSummary;
}

export interface CurrentRoute {
  trip: CurrentRouteTrip;
  waypoints: CurrentRouteWaypoint[];
  active_waypoint_seq: number;
}

export interface TripProgressSummary {
  completed_stops: number;
  total_stops: number;
  remaining_stops: number;
  progress_pct: number;
  next_stop: CurrentRouteWaypoint | null;
  current_waypoint: CurrentRouteWaypoint | null;
  queued_mutations_count: number;
}

export interface LocalTripSummary {
  id: string;
  tripCode: string;
  driverId: string;
  driverName: string;
  date: string;
  status: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  depotName: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalStops: number;
  isDownloaded: boolean;
  downloadedAt: string | null;
  updatedAt: string;
}

export interface DriverTripListItem {
  id: string;
  trip_code: string;
  driver_id: string;
  driver_name: string;
  date: string;
  status: TripStatus;
  vehicle_id: string;
  reg_number: string;
  model_name: string;
  depot_name: string;
  total_weight_kg: number;
  total_volume_m3: number;
  total_stops: number;
  is_downloaded: boolean;
}

export type DriverWaypoint = CurrentRouteWaypoint;
export type DriverOrderItem = CurrentRouteOrderItem;
export type LocalTripDetail = CurrentRoute;
export type LocalStopItem = CurrentRouteOrderItem;
export type LocalTripStop = CurrentRouteWaypoint;

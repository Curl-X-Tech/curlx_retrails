export interface VehicleTelemetry {
  id?: number;
  vehicle_id: string;
  trip_id?: string | null;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg?: number;
  reefer_temp_celsius?: number | null;
  ambient_temp_celsius?: number | null;
  fuel_level_pct?: number | null;
  battery_pct?: number | null;
  recorded_at: string;
}

export interface LiveVehicleTelemetry extends VehicleTelemetry {
  status: "en_route" | "at_stop" | "delayed";
  reg_number: string;
  model_name: string;
  vehicle_type: string;
  vehicle_category: "truck" | "van";
  temp: "reefer" | "ambient";
  brand: string;
  depot: string;
  image_url: string;
  driver_name: string;
  driver_phone: string;
  weight_percentage: number;
  weight_kg: number;
  max_weight_kg: number;
  volume_percentage: number;
  volume_cbm: number;
  max_volume_cbm: number;
  crates_count: number;
  next_stop: string;
  next_stop_eta: string;
  stops_total: number;
  stops_completed: number;
}

export interface TelemetryReportPayload {
  vehicle_id: string;
  trip_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg?: number;
  reefer_temp_celsius?: number;
  ambient_temp_celsius?: number;
  fuel_level_pct?: number;
  battery_pct?: number;
  recorded_at?: string;
}

export type TelemetryReportRequest = TelemetryReportPayload | TelemetryReportPayload[];

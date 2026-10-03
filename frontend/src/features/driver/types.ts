export type {
  CurrentRoute,
  CurrentRouteTrip,
  CurrentRouteWaypoint,
  CurrentRouteOrderItem,
  DriverWaypoint,
  DriverOrderItem,
  LocalTripDetail,
  LocalStopItem,
  LocalTripSummary,
  LocalTripStop,
  TripProgressSummary,
  WaypointStatus,
  TripStatus,
} from "@/api/driver";

export type {
  ProofOfDelivery,
  DiscrepancyReport,
  DiscrepancyIssueType,
  ArriveRequest,
  SubmitPodRequest,
  LogDiscrepancyRequest,
  OfflineMutationRecord,
  TelemetryRecord,
  MutationRecord,
  LocalTelemetryRecord,
} from "@/api/deliveries";

export interface DriverTripDriver {
  id: string;
  name: string;
  designation: string;
  licenseId: string;
  phone: string;
  avatarInitials: string;
}

export interface DriverTrip {
  id: string;
  tripCode: string;
  sealNumber: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weightCapKg: number;
  volumeCapM3: number;
  reeferCurrentTempC?: number;
  reeferTargetTempC?: number;
  fuelType: "diesel" | "petrol" | "electric";
  kmPerL: number;
  weeklyFuelQuotaL: number;
  fuelRemainingL: number;
  currentOdometerKm: number;
  depotName: string;
  depotLat: number;
  depotLng: number;
  driver: DriverTripDriver;
  status: "in_transit" | "paused" | "completed";
  activeWaypointSeq: number;
  plannedDepartureTime: string;
  estimatedReturnTime: string;
  breakDurationMinutes: number;
  onBreak: boolean;
  waypoints: import("@/api/driver").CurrentRouteWaypoint[];
}

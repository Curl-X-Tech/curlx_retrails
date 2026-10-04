import type { BayWithManifest, TripChecklist } from "@/api/loader/types";
import type { LoaderOrderItem, LoaderVehicleTrip, LoaderWaypoint } from "../types";

export function mapChecklistToWaypoints(checklist?: TripChecklist): LoaderWaypoint[] {
  if (!checklist?.waypoints) return [];

  // Normalize 0-indexed route legs to 1-based Drop numbers
  const hasZeroSeq = checklist.waypoints.some((w) => w.seq === 0);
  const normalized = checklist.waypoints.map((wp) => ({
    ...wp,
    seq: hasZeroSeq ? wp.seq + 1 : wp.seq,
  }));

  // Reverse sequence so final delivery stop (deepest cargo in nose) is loaded first
  const sorted = [...normalized].sort((a, b) => b.seq - a.seq);

  return sorted.map((wp, idx) => ({
    seq: wp.seq,
    loadOrder: idx + 1,
    outletId: wp.outlet_id,
    outletCode: wp.outlet_code,
    outletName: wp.outlet_name,
    dockType: (wp.dock_type as any) || "rear_dock",
    deliveryWindow: wp.delivery_window,
    parkingConstraint: (wp.parking_constraint as any) || "normal",
    isSealed: wp.is_sealed,
    sealedAt: wp.sealed_at,
    items: wp.items.map((i): LoaderOrderItem => ({
      id: i.id,
      orderRef: i.package_code,
      packageCode: i.package_code,
      sku: i.sku,
      itemTitle: i.item_title,
      category: i.category,
      crateCount: i.crate_count,
      weightKg: i.gross_weight_kg,
      volumeM3: i.gross_volume_m3,
      temperature: i.temperature_req || "chilled",
      isReefer: i.is_reefer,
      specialHandlingCode: (i.special_handling_code as any) || "COL",
      bayCoordinates: { bayX: 4, bayY: 2, bayZ: 1 },
      stagingBay: i.staging_bay,
      status: (i.verification_status === "flagged_shortfall"
        ? "flagged"
        : i.verification_status) as "pending" | "verified" | "flagged",
      notes: i.note,
    })),
  }));
}

function formatDepartureTime(raw?: string): string {
  if (!raw) return "06:30 AM";
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h < 10 ? "0" : ""}${h}:${m} ${ampm}`;
  }
  return raw;
}

export function mapBayToTrip(
  bayData: BayWithManifest,
  userDepotId: string,
  waypoints: LoaderWaypoint[] = [],
  sealNumber?: string | null
): LoaderVehicleTrip {
  const { bay, vehicle, driver, trip, progress } = bayData;
  const verifiedCount = waypoints.reduce(
    (acc, wp) => acc + wp.items.filter((i) => i.status === "verified").length,
    0
  );
  const totalCount = waypoints.reduce((acc, wp) => acc + wp.items.length, 0);

  return {
    id: trip.id,
    tripCode: trip.trip_code,
    tripSequence: 1,
    sealNumber: sealNumber || "SL-90821-B",
    vehicleId: vehicle.vehicle_id,
    regNumber: vehicle.reg_number,
    modelName: vehicle.model_name,
    type: vehicle.type,
    temp: vehicle.temp,
    weightCapKg: vehicle.weight_cap_kg,
    volumeCapM3: vehicle.volume_cap_m3,
    imagePath:
      vehicle.temp === "reefer"
        ? "/vehicle-images/freeze.png"
        : "/vehicle-images/dry.png",
    depotName: userDepotId === "depot-kandy" ? "Kandy Depot" : "Peliyagoda Depot",
    stopsCount: waypoints.length || trip.stops_count,
    nextStopName: waypoints[0]?.outletName || trip.next_stop_name || "Waypoint",
    dispatchDate: trip.dispatch_date,
    plannedDepartureTime: formatDepartureTime(trip.planned_departure_time),
    departureCountdownMinutes: 35,
    status: (trip.status as any) || "loading",
    dockBay: bay.bay_number,
    verifiedItemsCount: waypoints.length ? verifiedCount : progress.verified_items_count,
    totalItemsCount: waypoints.length ? totalCount : progress.total_items_count,
    driver: {
      name: driver.name || "Saman Perera",
      designation: "Heavy Vehicle Pilot",
      licenseId: driver.license_number || "DL-90821-WP-89",
      phone: driver.phone || "+94 77 123 4567",
      avatarInitials: (driver.name || "SP")
        .split(" ")
        .map((n) => n[0])
        .join(""),
    },
    payload: {
      currentKg: progress.payload_kg,
      maxKg: progress.max_payload_kg,
      percentage: progress.payload_percentage,
      secondaryMetric: "Payload",
      currentVolumeM3: progress.volume_m3,
      maxVolumeM3: progress.max_volume_m3,
    },
    waypoints,
  };
}

export function getDefaultTrip(
  selectedTripId: string,
  waypoints: LoaderWaypoint[]
): LoaderVehicleTrip {
  return {
    id: selectedTripId,
    tripCode: "RT-14",
    tripSequence: 1,
    sealNumber: "SL-90821-B",
    vehicleId: "VEH001",
    regNumber: "NP-4811",
    modelName: "Isuzu ELF NPR",
    type: "truck",
    temp: "reefer",
    weightCapKg: 4200,
    volumeCapM3: 28.0,
    imagePath: "/vehicle-images/freeze.png",
    depotName: "Peliyagoda Depot",
    stopsCount: waypoints.length,
    nextStopName: waypoints[0]?.outletName || "Depot Exit",
    plannedDepartureTime: "05:30 AM",
    departureCountdownMinutes: 35,
    status: "loading",
    dockBay: "Bay 01",
    driver: {
      name: "Saman Perera",
      designation: "Heavy Vehicle Pilot",
      licenseId: "DL-90821-WP-89",
      phone: "+94 77 123 4567",
      avatarInitials: "SP",
    },
    payload: {
      currentKg: 3360,
      maxKg: 4200,
      percentage: 80,
      secondaryMetric: "Payload",
      currentVolumeM3: 22.4,
      maxVolumeM3: 28.0,
    },
    waypoints,
  };
}

import type {
  AllocationDetail,
  AllocationKpis,
  AllocationSummary,
} from "@/api/allocations";
import type {
  AllocationManifestDetail,
  AllocationSummaryKPIs,
  BrandName,
  VehicleAllocation,
} from "@/types";

const VEHICLE_IMAGES = {
  van: "/vehicle-images/van.png",
  dry_lorry: "/vehicle-images/dry.png",
  freeze_lorry: "/vehicle-images/freeze.png",
} as const;

type Category = keyof typeof VEHICLE_IMAGES;

function categoryOf(type: string | undefined, reefer: boolean): Category {
  if (type === "van") return "van";
  return reefer ? "freeze_lorry" : "dry_lorry";
}

function statusOf(status: AllocationSummary["status"]): VehicleAllocation["status"] {
  if (status === "scheduled") return "allocated";
  if (status === "in_transit") return "dispatched";
  return status;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function toVehicleAllocation(trip: AllocationSummary): VehicleAllocation {
  const reefer = (trip.vehicle_model ?? "").toLowerCase().includes("reefer");
  const category = categoryOf(trip.vehicle_type, reefer);
  const weightCap = trip.weight_cap_kg ?? 0;
  const volumeCap = trip.volume_cap_m3 ?? 0;
  return {
    id: trip.id,
    code: trip.trip_code,
    vehicleId: trip.vehicle_id,
    plateNumber: trip.vehicle_reg_number ?? "",
    vehicleModel: trip.vehicle_model ?? "",
    vehicleCategory: category,
    vehicleType: trip.vehicle_type ?? "",
    type: trip.vehicle_type === "van" ? "van" : "truck",
    temp: reefer ? "reefer" : "ambient",
    brand: (trip.brand_name ?? undefined) as BrandName | undefined,
    depot: trip.depot_name,
    tripSequence: trip.trip_sequence,
    imageUrl: VEHICLE_IMAGES[category],
    driverName: trip.driver_name ?? "Unassigned",
    driverPhone: trip.driver_phone ?? "",
    status: statusOf(trip.status),
    temperatureZone: reefer ? "chilled" : "ambient",
    routeCode: trip.trip_code,
    routeName: `${trip.district_name ?? ""} - ${trip.brand_name ?? ""}`,
    hubName: trip.depot_name ?? "",
    departureTime: trip.planned_start_time?.slice(11, 16) ?? "",
    estimatedReturnTime: trip.actual_end_time?.slice(11, 16) ?? "",
    allocatedWeightKg: trip.total_payload_kg ?? 0,
    maxWeightKg: weightCap,
    weightPercentage: trip.weight_utilization_pct,
    allocatedVolumeCbm: trip.total_volume_m3 ?? 0,
    maxVolumeCbm: volumeCap,
    volumePercentage: trip.volume_utilization_pct,
    cratesAllocated: trip.total_packages,
    assignedStops: [],
  };
}

export function toKpis(kpis: AllocationKpis | undefined): AllocationSummaryKPIs {
  return {
    totalVehicles: kpis?.total_trips ?? 0,
    activeAllocations: kpis?.active_trips ?? 0,
    totalCratesAllocated: kpis?.total_packages_allocated ?? 0,
    totalWeightKg: kpis?.total_weight_kg ?? 0,
    totalVolumeCbm: kpis?.total_volume_m3 ?? 0,
    averageCapacityPercentage: kpis?.avg_weight_utilization_pct ?? 0,
    fullyLoadedVehicles: kpis?.fully_utilized_trips ?? 0,
  };
}

export function toManifest(detail: AllocationDetail): AllocationManifestDetail {
  const { trip, vehicle, driver, summary } = detail;
  return {
    id: trip.id,
    manifestCode: trip.trip_code,
    allocationId: trip.id,
    tripCode: trip.trip_code,
    tripSequence: trip.trip_sequence,
    brand: detail.brand.name as BrandName,
    district: detail.district.name,
    depot: detail.depot.name,
    driver: {
      employeeCode: driver.employee_code,
      name: driver.name,
      email: driver.email,
      role: "driver",
      licenseId: driver.license_number ?? "",
      phone: driver.phone,
      avatarText: initials(driver.name),
    },
    specs: {
      unitId: vehicle.vehicle_id,
      vehicleId: vehicle.vehicle_id,
      model: vehicle.model_name,
      regNumber: vehicle.reg_number,
      sealNumber: trip.seal_number ?? "",
      type: vehicle.type,
      temp: vehicle.temp,
      maxPayloadKg: vehicle.weight_cap_kg,
      boxVolumeCbm: vehicle.volume_cap_m3,
      weeklyFuelQuotaL: vehicle.weekly_fuel_quota_l,
    },
    payloadKg: summary.total_payload_kg,
    maxPayloadKg: vehicle.weight_cap_kg,
    payloadPercentage: summary.weight_utilization_pct,
    volumeCbm: summary.total_volume_m3,
    maxVolumeCbm: vehicle.volume_cap_m3,
    volumePercentage: summary.volume_utilization_pct,
    waypoints: detail.legs.map((leg) => ({
      seq: leg.seq,
      outletId: leg.to_outlet_id,
      name: leg.outlet_name,
      lat: leg.latitude ?? 0,
      lng: leg.longitude ?? 0,
      crates: leg.crates_count,
      eta: leg.planned_arrival_time.slice(0, 5),
      status: leg.status,
    })),
    cargoList: detail.legs.flatMap((leg) =>
      (leg.items ?? []).map((item) => ({
        id: item.id,
        code: item.package_code,
        weightKg: Number((item.unit_weight_kg * item.requested_qty).toFixed(2)),
        store: leg.outlet_name,
        stopSeq: leg.seq,
        stopName: leg.outlet_name,
        destination: leg.outlet_name,
        shc: (item.special_handling_code ?? "GEN") as "GEN",
      }))
    ),
  };
}

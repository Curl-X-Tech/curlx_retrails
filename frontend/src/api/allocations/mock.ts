import { mockDelay } from "@/api/_mock-delay";
import {
  MOCK_ALLOCATION_DETAILS,
  MOCK_ALLOCATION_KPIS,
  MOCK_ALLOCATION_SUMMARIES,
} from "./mock-data";
import type {
  AllocationDetail,
  AllocationFilters,
  AllocationKpis,
  AllocationSummary,
  ConfirmAllocationResponse,
} from "./types";

let allocationSummariesState: AllocationSummary[] = [...MOCK_ALLOCATION_SUMMARIES];
const allocationDetailsState: Record<string, AllocationDetail> = {
  ...MOCK_ALLOCATION_DETAILS,
};

export async function getAllocationsMock(
  filters: AllocationFilters = {}
): Promise<AllocationSummary[]> {
  await mockDelay();
  let result = [...allocationSummariesState];

  if (filters.dispatch_date) {
    result = result.filter((a) => a.dispatch_date === filters.dispatch_date);
  }
  if (filters.depot_id) {
    result = result.filter((a) => a.depot_id === filters.depot_id);
  }
  if (filters.brand_id) {
    result = result.filter((a) => a.brand_id === filters.brand_id);
  }
  if (filters.district_id) {
    result = result.filter((a) => a.district_id === filters.district_id);
  }
  if (filters.status && filters.status !== "all") {
    result = result.filter((a) => a.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.trip_code.toLowerCase().includes(q) ||
        a.vehicle_reg_number?.toLowerCase().includes(q) ||
        a.driver_name?.toLowerCase().includes(q) ||
        a.district_name?.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getAllocationDetailMock(id: string): Promise<AllocationDetail> {
  await mockDelay();
  const detail = allocationDetailsState[id];
  if (detail) {
    return detail;
  }
  const summary = allocationSummariesState.find((a) => a.id === id);
  if (!summary) {
    throw new Error(`Allocation manifest ${id} not found`);
  }

  return {
    trip: { ...summary },
    vehicle: {
      id: summary.vehicle_id,
      vehicle_id: summary.vehicle_id,
      reg_number: summary.vehicle_reg_number || "WP-AB-1234",
      model_name: summary.vehicle_model || "Isuzu ELF",
      type: (summary.vehicle_type as "truck" | "van") || "truck",
      temp: "reefer",
      weight_cap_kg: summary.weight_cap_kg || 5000,
      volume_cap_m3: summary.volume_cap_m3 || 20,
    },
    driver: {
      id: summary.driver_id,
      name: summary.driver_name || "Assigned Driver",
      phone: summary.driver_phone || "+94 77 000 0000",
    },
    depot: {
      id: summary.depot_id,
      code: "PEL",
      name: summary.depot_name || "Peliyagoda Central DC",
    },
    brand: {
      id: summary.brand_id,
      code: "FRESH",
      name: summary.brand_name || "Waypoint Fresh",
    },
    district: {
      id: summary.district_id,
      name: summary.district_name || "Colombo",
    },
    legs: [],
    summary: {
      total_orders: summary.total_orders || 1,
      total_packages: summary.total_packages || 20,
      total_payload_kg: summary.total_payload_kg || 1000,
      total_volume_m3: summary.total_volume_m3 || 5,
      cargo_value_lkr: summary.cargo_value_lkr || 500000,
      weight_utilization_pct: summary.weight_utilization_pct || 80,
      volume_utilization_pct: summary.volume_utilization_pct || 80,
    },
  };
}

export async function getAllocationKpisMock(
  _filters: AllocationFilters = {}
): Promise<AllocationKpis> {
  await mockDelay();
  const totalTrips = allocationSummariesState.length;
  const activeTrips = allocationSummariesState.filter(
    (a) =>
      a.status === "loading" || a.status === "dispatched" || a.status === "in_transit"
  ).length;
  const completedTrips = allocationSummariesState.filter(
    (a) => a.status === "completed"
  ).length;

  return {
    ...MOCK_ALLOCATION_KPIS,
    total_trips: totalTrips,
    active_trips: activeTrips,
    completed_trips: completedTrips,
  };
}

export async function confirmAllocationMock(
  id: string
): Promise<ConfirmAllocationResponse> {
  await mockDelay();
  const summary = allocationSummariesState.find((a) => a.id === id);
  if (summary) {
    summary.status = "dispatched";
    summary.updated_at = new Date().toISOString();
  }
  if (allocationDetailsState[id]) {
    allocationDetailsState[id].trip.status = "dispatched";
    allocationDetailsState[id].trip.updated_at = new Date().toISOString();
  }

  return {
    success: true,
    trip_id: id,
    status: "dispatched",
    confirmed_at: new Date().toISOString(),
  };
}

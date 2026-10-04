import type {
  CreateVehiclePayload,
  Driver,
  DriverFilters,
  UpdateVehiclePayload,
  Vehicle,
  VehicleFilters,
} from "./types";

const PEL_DEPOT = "depot-peliyagoda";
const KDY_DEPOT = "depot-kandy";

const INITIAL_DRIVERS: Driver[] = [
  {
    id: "drv-01",
    user_id: "u-driv-01",
    employee_code: "EMP-DRV-001",
    first_name: "Saman",
    last_name: "Perera",
    email: "saman.perera@retrails.lk",
    license_number: "DL-WP-90214",
    phone_number: "+94 77 123 4567",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.95,
    total_completed_trips: 142,
    is_active: true,
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "drv-02",
    user_id: "u-driv-02",
    employee_code: "EMP-DRV-002",
    first_name: "Sunil",
    last_name: "Fernando",
    email: "sunil.fernando@retrails.lk",
    license_number: "DL-WP-88412",
    phone_number: "+94 71 456 7890",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.88,
    total_completed_trips: 98,
    is_active: true,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "drv-03",
    user_id: "u-driv-03",
    employee_code: "EMP-DRV-003",
    first_name: "Nimal",
    last_name: "Jayasinghe",
    email: "nimal.jayasinghe@retrails.lk",
    license_number: "DL-WP-77412",
    phone_number: "+94 76 987 6543",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Van (Class B)",
    safety_rating: 4.92,
    total_completed_trips: 110,
    is_active: true,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "drv-04",
    user_id: "u-driv-04",
    employee_code: "EMP-DRV-004",
    first_name: "Kamal",
    last_name: "Gunawardena",
    email: "kamal.gunawardena@retrails.lk",
    license_number: "DL-WP-66512",
    phone_number: "+94 77 345 6789",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.75,
    total_completed_trips: 84,
    is_active: true,
    created_at: "2026-02-10T00:00:00Z",
  },
  {
    id: "drv-05",
    user_id: "u-driv-05",
    employee_code: "EMP-DRV-005",
    first_name: "Chaminda",
    last_name: "Silva",
    email: "chaminda.silva@retrails.lk",
    license_number: "DL-WP-55412",
    phone_number: "+94 72 234 5678",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Van (Class B)",
    safety_rating: 4.8,
    total_completed_trips: 76,
    is_active: true,
    created_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "drv-06",
    user_id: "u-driv-06",
    employee_code: "EMP-DRV-006",
    first_name: "Dinesh",
    last_name: "Wickramasinghe",
    email: "dinesh.w@retrails.lk",
    license_number: "DL-WP-44312",
    phone_number: "+94 78 765 4321",
    assigned_depot_id: PEL_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.9,
    total_completed_trips: 130,
    is_active: true,
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "drv-07",
    user_id: "u-driv-07",
    employee_code: "EMP-DRV-007",
    first_name: "Roshan",
    last_name: "Kumara",
    email: "roshan.kumara@retrails.lk",
    license_number: "DL-CP-33212",
    phone_number: "+94 77 889 0123",
    assigned_depot_id: KDY_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.85,
    total_completed_trips: 65,
    is_active: true,
    created_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "drv-08",
    user_id: "u-driv-08",
    license_number: "DL-CP-22112",
    phone_number: "+94 71 990 1234",
    assigned_depot_id: KDY_DEPOT,
    license_class: "Heavy Commercial (Class A)",
    safety_rating: 4.91,
    total_completed_trips: 92,
    is_active: true,
    created_at: "2026-03-10T00:00:00Z",
  },
];

function buildVehicles(): Vehicle[] {
  const list: Vehicle[] = [];
  const ts = "2026-01-01T00:00:00Z";
  for (let i = 1; i <= 60; i++) {
    const num = String(i).padStart(3, "0");
    const vid = `VEH${num}`;
    const isKandy = i % 4 === 0;
    const depot = isKandy ? KDY_DEPOT : PEL_DEPOT;

    if (i <= 12) {
      list.push({
        id: `veh-${num}`,
        vehicle_id: vid,
        reg_number: `WP-RF-${1000 + i}`,
        model_name: "Isuzu ELF NPR Reefer",
        type: "truck",
        temp: "reefer",
        weight_cap_kg: 5200,
        volume_cap_m3: 18.0,
        fuel_type: "diesel",
        km_per_l: 4.5,
        weekly_fuel_quota_l: 350,
        consumed_fuel_l: 120.5,
        assigned_depot_id: depot,
        assigned_driver_id: INITIAL_DRIVERS[(i - 1) % INITIAL_DRIVERS.length].id,
        status:
          i === 1
            ? "in_transit"
            : i === 2
              ? "loading"
              : i === 12
                ? "in_workshop"
                : "available",
        is_active: true,
        created_at: ts,
        updated_at: ts,
      });
    } else if (i <= 52) {
      list.push({
        id: `veh-${num}`,
        vehicle_id: vid,
        reg_number: `WP-DR-${2000 + (i - 12)}`,
        model_name: "Mitsubishi Fuso Canter",
        type: "truck",
        temp: "ambient",
        weight_cap_kg: 6000,
        volume_cap_m3: 22.0,
        fuel_type: "diesel",
        km_per_l: 5.0,
        weekly_fuel_quota_l: 320,
        consumed_fuel_l: 85.0,
        assigned_depot_id: depot,
        assigned_driver_id: INITIAL_DRIVERS[(i - 1) % INITIAL_DRIVERS.length].id,
        status: i === 13 ? "in_transit" : i === 14 ? "loading" : "available",
        is_active: true,
        created_at: ts,
        updated_at: ts,
      });
    } else if (i <= 56) {
      list.push({
        id: `veh-${num}`,
        vehicle_id: vid,
        reg_number: `WP-RV-${3000 + (i - 52)}`,
        model_name: "Nissan NV350 Caravan Reefer",
        type: "van",
        temp: "reefer",
        weight_cap_kg: 1800,
        volume_cap_m3: 7.2,
        fuel_type: "diesel",
        km_per_l: 8.5,
        weekly_fuel_quota_l: 180,
        consumed_fuel_l: 45.0,
        assigned_depot_id: depot,
        assigned_driver_id: INITIAL_DRIVERS[(i - 1) % INITIAL_DRIVERS.length].id,
        status: "available",
        is_active: true,
        created_at: ts,
        updated_at: ts,
      });
    } else {
      list.push({
        id: `veh-${num}`,
        vehicle_id: vid,
        reg_number: `WP-AV-${4000 + (i - 56)}`,
        model_name: "Tata Ace Mega Express",
        type: "van",
        temp: "ambient",
        weight_cap_kg: 1800,
        volume_cap_m3: 7.2,
        fuel_type: "diesel",
        km_per_l: 9.0,
        weekly_fuel_quota_l: 160,
        consumed_fuel_l: 38.0,
        assigned_depot_id: depot,
        assigned_driver_id: INITIAL_DRIVERS[(i - 1) % INITIAL_DRIVERS.length].id,
        status: "available",
        is_active: true,
        created_at: ts,
        updated_at: ts,
      });
    }
  }
  return list;
}

const mockVehicleStore = new Map<string, Vehicle>(buildVehicles().map((v) => [v.id, v]));
const mockDriverStore = new Map<string, Driver>(INITIAL_DRIVERS.map((d) => [d.id, d]));

export async function getVehiclesMock(filters?: VehicleFilters): Promise<Vehicle[]> {
  let list = Array.from(mockVehicleStore.values());
  if (!filters) return list;
  if (filters.depot_id)
    list = list.filter((v) => v.assigned_depot_id === filters.depot_id);
  if (filters.type) list = list.filter((v) => v.type === filters.type);
  if (filters.temp) list = list.filter((v) => v.temp === filters.temp);
  if (filters.status) list = list.filter((v) => v.status === filters.status);
  if (filters.is_active !== undefined)
    list = list.filter((v) => v.is_active === filters.is_active);
  return list;
}

export async function getVehicleMock(id: string): Promise<Vehicle> {
  const v =
    mockVehicleStore.get(id) ||
    Array.from(mockVehicleStore.values()).find((item) => item.vehicle_id === id);
  if (!v) throw new Error(`Vehicle ${id} not found`);
  return v;
}

export async function createVehicleMock(payload: CreateVehiclePayload): Promise<Vehicle> {
  const ts = new Date().toISOString();
  const count = mockVehicleStore.size + 1;
  const num = String(count).padStart(3, "0");
  const vehicle: Vehicle = {
    id: `veh-${num}`,
    vehicle_id: payload.vehicle_id || `VEH${num}`,
    fuel_type: "diesel",
    consumed_fuel_l: 0,
    is_active: true,
    ...payload,
    created_at: ts,
    updated_at: ts,
    status: "available",
  };
  mockVehicleStore.set(vehicle.id, vehicle);
  return vehicle;
}

export async function updateVehicleMock(
  id: string,
  payload: UpdateVehiclePayload
): Promise<Vehicle> {
  const existing = await getVehicleMock(id);
  const updated: Vehicle = {
    ...existing,
    ...payload,
    updated_at: new Date().toISOString(),
  };
  mockVehicleStore.set(updated.id, updated);
  return updated;
}

export async function getDriversMock(filters?: DriverFilters): Promise<Driver[]> {
  let list = Array.from(mockDriverStore.values());
  if (filters?.depot_id)
    list = list.filter((d) => d.assigned_depot_id === filters.depot_id);
  if (filters?.is_active !== undefined)
    list = list.filter((d) => d.is_active === filters.is_active);
  return list;
}

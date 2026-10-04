export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...usersKeys.lists(), { filters }] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export const masterKeys = {
  all: ["master"] as const,
  depots: () => [...masterKeys.all, "depots"] as const,
  depot: (id: string) => [...masterKeys.depots(), id] as const,
  districts: () => [...masterKeys.all, "districts"] as const,
  brands: () => [...masterKeys.all, "brands"] as const,
  outlets: () => [...masterKeys.all, "outlets"] as const,
  outlet: (id: string) => [...masterKeys.outlets(), id] as const,
  items: () => [...masterKeys.all, "items"] as const,
  item: (id: string) => [...masterKeys.items(), id] as const,
  prices: () => [...masterKeys.all, "prices"] as const,
  pricesActive: () => [...masterKeys.prices(), "active"] as const,
  priceByItem: (itemId: string) => [...masterKeys.prices(), "item", itemId] as const,
  calendarDays: () => [...masterKeys.all, "calendar", "operating-days"] as const,
  calendarSurge: (params?: Record<string, unknown>) =>
    [...masterKeys.all, "calendar", "surge", { params }] as const,
  calendarRange: (from: string, to: string) =>
    [...masterKeys.all, "calendar", "range", from, to] as const,
};

export const fleetKeys = {
  all: ["fleet"] as const,
  vehicles: () => [...fleetKeys.all, "vehicles"] as const,
  vehicle: (id: string) => [...fleetKeys.vehicles(), id] as const,
  drivers: () => [...fleetKeys.all, "drivers"] as const,
};

export const telemetryKeys = {
  all: ["telemetry"] as const,
  live: () => [...telemetryKeys.all, "live"] as const,
  vehicleLatest: (id: string) => [...telemetryKeys.all, "vehicle", id, "latest"] as const,
};

export const ordersKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...ordersKeys.lists(), { filters }] as const,
  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
};

export const deferralsKeys = {
  all: ["deferrals"] as const,
  lists: () => [...deferralsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...deferralsKeys.lists(), { filters }] as const,
  summary: () => [...deferralsKeys.all, "summary"] as const,
};

export const allocationsKeys = {
  all: ["allocations"] as const,
  lists: () => [...allocationsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...allocationsKeys.lists(), { filters }] as const,
  details: () => [...allocationsKeys.all, "detail"] as const,
  detail: (id: string) => [...allocationsKeys.details(), id] as const,
  summary: (filters?: Record<string, unknown>) =>
    [...allocationsKeys.all, "summary", { filters }] as const,
  solverStatus: () => [...allocationsKeys.all, "engine", "status"] as const,
};

export const loaderKeys = {
  all: ["loader"] as const,
  bays: () => [...loaderKeys.all, "bays"] as const,
  checklist: (tripId: string) =>
    [...loaderKeys.all, "trips", tripId, "checklist"] as const,
};

export const driverKeys = {
  all: ["driver"] as const,
  currentRoute: (tripId?: string) =>
    [...driverKeys.all, "routes", "current", tripId ?? "active"] as const,
  trips: () => [...driverKeys.all, "trips"] as const,
};

export const deliveriesKeys = {
  all: ["deliveries"] as const,
  waypoint: (id: string) => [...deliveriesKeys.all, "waypoint", id] as const,
};

export const syncKeys = {
  all: ["sync"] as const,
  status: () => [...syncKeys.all, "status"] as const,
};

export const engineKeys = {
  all: ["engine"] as const,
  status: () => [...engineKeys.all, "status"] as const,
};

export const queryKeys = {
  auth: authKeys,
  users: usersKeys,
  master: masterKeys,
  fleet: fleetKeys,
  telemetry: telemetryKeys,
  orders: ordersKeys,
  deferrals: deferralsKeys,
  allocations: allocationsKeys,
  engine: engineKeys,
  loader: loaderKeys,
  driver: driverKeys,
  deliveries: deliveriesKeys,
  sync: syncKeys,
} as const;

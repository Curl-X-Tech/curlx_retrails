import { mockDelay } from "@/api/_mock-delay";
import { enqueue } from "@/sync/queue";
import { MOCK_CARGO_BAYS, MOCK_TRIP_CHECKLISTS } from "./mock-data";
import type {
  BayWithManifest,
  ConfirmDepartureRequest,
  ConfirmDepartureResponse,
  LoadingChecklistItem,
  SealWaypointRequest,
  SealWaypointResponse,
  TripChecklist,
  VerifyItemRequest,
  VerifyItemResponse,
} from "./types";

let cargoBaysState: BayWithManifest[] = [...MOCK_CARGO_BAYS];
const tripChecklistsState: Record<string, TripChecklist> = { ...MOCK_TRIP_CHECKLISTS };

export async function getBaysMock(depotId?: string): Promise<BayWithManifest[]> {
  await mockDelay();
  if (!depotId) return cargoBaysState;
  return cargoBaysState.filter(
    (b) =>
      b.bay.depot_id === depotId || (depotId === "PEL" && b.bay.depot_id === "depot-pel")
  );
}

export async function getTripChecklistMock(tripId: string): Promise<TripChecklist> {
  await mockDelay();
  const checklist = tripChecklistsState[tripId];
  if (!checklist) {
    throw new Error(`Checklist for trip ${tripId} not found`);
  }
  return checklist;
}

export async function verifyItemMock(
  itemId: string,
  payload: VerifyItemRequest,
  targetTripId = "trip-1"
): Promise<VerifyItemResponse> {
  await mockDelay();
  const checklist = tripChecklistsState[targetTripId];
  if (!checklist) {
    throw new Error(`Trip ${targetTripId} not found`);
  }

  let foundItem: LoadingChecklistItem | null = null;
  for (const wp of checklist.waypoints) {
    const item = wp.items.find(
      (i) => i.id === itemId || i.order_item_id === itemId || i.package_code === itemId
    );
    if (item) {
      item.verification_status = payload.status;
      if (payload.shortfall_qty !== undefined) {
        item.shortfall_qty = payload.shortfall_qty;
      }
      if (payload.note !== undefined) {
        item.note = payload.note;
      }
      foundItem = item;
      break;
    }
  }

  if (!foundItem) {
    throw new Error(`Item ${itemId} not found in trip ${targetTripId}`);
  }

  let verifiedCount = 0;
  let totalCount = 0;
  checklist.waypoints.forEach((wp) => {
    wp.items.forEach((item) => {
      totalCount++;
      if (item.verification_status === "verified") verifiedCount++;
    });
  });
  checklist.summary.verified_items = verifiedCount;
  checklist.summary.total_items = totalCount;

  const bay = cargoBaysState.find((b) => b.trip.id === targetTripId);
  if (bay) {
    bay.progress.verified_items_count = verifiedCount;
  }

  const idempotencyKey = crypto.randomUUID();
  try {
    await enqueue({
      idempotency_key: idempotencyKey,
      entity_type: "loading_checklist",
      action: "verify",
      payload: {
        idempotency_key: idempotencyKey,
        entity_type: "loading_checklist",
        action: "verify",
        trip_id: targetTripId,
        item_id: itemId,
        status: payload.status,
        shortfall_qty: payload.shortfall_qty,
        note: payload.note,
        client_timestamp: new Date().toISOString(),
      },
      client_timestamp: new Date().toISOString(),
      user_id: "",
    });
  } catch (err) {
    console.warn("Dexie mutation queue insert fallback:", err);
  }

  return {
    success: true,
    item_id: itemId,
    status: payload.status,
    verified_at: new Date().toISOString(),
  };
}

export async function sealWaypointMock(
  tripId: string,
  seq: number,
  _payload?: SealWaypointRequest
): Promise<SealWaypointResponse> {
  await mockDelay();
  const checklist = tripChecklistsState[tripId];
  if (!checklist) {
    throw new Error(`Trip ${tripId} not found`);
  }

  const waypoint = checklist.waypoints.find((wp) => wp.seq === seq);
  if (!waypoint) {
    throw new Error(`Waypoint seq ${seq} not found`);
  }

  const unverifiedItems = waypoint.items.filter(
    (i) => i.verification_status === "pending"
  );
  if (unverifiedItems.length > 0) {
    throw new Error("A waypoint can be sealed only when all its items are verified.");
  }

  waypoint.is_sealed = true;
  waypoint.sealed_at = new Date().toISOString();

  const sealedCount = checklist.waypoints.filter((w) => w.is_sealed).length;
  checklist.summary.sealed_waypoints = sealedCount;
  checklist.summary.is_ready_for_departure = sealedCount === checklist.waypoints.length;

  const bay = cargoBaysState.find((b) => b.trip.id === tripId);
  if (bay && checklist.summary.is_ready_for_departure) {
    bay.bay.dock_status = "verified_sealed";
  }

  const idempotencyKey = crypto.randomUUID();
  await enqueue({
    idempotency_key: idempotencyKey,
    entity_type: "loading_checklist",
    action: "update",
    payload: {
      idempotency_key: idempotencyKey,
      action: "seal_waypoint",
      trip_id: tripId,
      seq,
      sealed_at: waypoint.sealed_at,
    },
    client_timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    trip_id: tripId,
    seq,
    is_sealed: true,
    sealed_at: new Date().toISOString(),
  };
}

export async function confirmDepartureMock(
  tripId: string,
  payload: ConfirmDepartureRequest
): Promise<ConfirmDepartureResponse> {
  await mockDelay();
  const checklist = tripChecklistsState[tripId];
  if (!checklist) {
    throw new Error(`Trip ${tripId} not found`);
  }

  const unsealedWaypoints = checklist.waypoints.filter((wp) => !wp.is_sealed);
  if (unsealedWaypoints.length > 0) {
    throw new Error("Departure requires all waypoints to be verified and sealed.");
  }

  checklist.trip.status = "dispatched";
  checklist.trip.seal_number = payload.seal_number;

  const bay = cargoBaysState.find((b) => b.trip.id === tripId);
  if (bay) {
    bay.bay.dock_status = "departed";
    bay.bay.completed_at = new Date().toISOString();
    bay.trip.status = "dispatched";
  }

  const idempotencyKey = crypto.randomUUID();
  await enqueue({
    idempotency_key: idempotencyKey,
    entity_type: "loading_checklist",
    action: "update",
    payload: {
      idempotency_key: idempotencyKey,
      action: "confirm_departure",
      trip_id: tripId,
      seal_number: payload.seal_number,
    },
    client_timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    trip_id: tripId,
    status: "dispatched",
    departed_at: new Date().toISOString(),
  };
}

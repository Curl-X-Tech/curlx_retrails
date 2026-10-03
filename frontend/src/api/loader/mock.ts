import { db } from "@/lib/dexie-db";
import { MOCK_CARGO_BAYS, MOCK_TRIP_CHECKLISTS } from "./mock-data";
import type {
  BayWithManifest,
  ConfirmDepartureRequest,
  ConfirmDepartureResponse,
  SealWaypointRequest,
  SealWaypointResponse,
  TripChecklist,
  VerifyItemRequest,
  VerifyItemResponse,
} from "./types";

let cargoBaysState: BayWithManifest[] = [...MOCK_CARGO_BAYS];
const tripChecklistsState: Record<string, TripChecklist> = { ...MOCK_TRIP_CHECKLISTS };

export async function getBaysMock(depotId?: string): Promise<BayWithManifest[]> {
  if (!depotId) return cargoBaysState;
  return cargoBaysState.filter(
    (b) =>
      b.bay.depot_id === depotId || (depotId === "PEL" && b.bay.depot_id === "depot-pel")
  );
}

export async function getTripChecklistMock(tripId: string): Promise<TripChecklist> {
  const checklist = tripChecklistsState[tripId];
  if (!checklist) {
    throw new Error(`Checklist for trip ${tripId} not found`);
  }
  return checklist;
}

export async function verifyItemMock(
  itemId: string,
  payload: VerifyItemRequest
): Promise<VerifyItemResponse> {
  let targetTripId: string | null = null;
  let targetItem: any = null;

  for (const tripId in tripChecklistsState) {
    const checklist = tripChecklistsState[tripId];
    if (checklist.trip.status !== "loading" && checklist.trip.status !== "scheduled") {
      continue;
    }
    for (const wp of checklist.waypoints) {
      const found = wp.items.find((i) => i.id === itemId);
      if (found) {
        targetTripId = tripId;
        targetItem = found;
        break;
      }
    }
    if (targetItem) break;
  }

  if (!targetItem || !targetTripId) {
    throw new Error("Item can be verified only on a trip in active loading state.");
  }

  targetItem.verification_status = payload.status;
  targetItem.verified_at = new Date().toISOString();
  if (payload.shortfall_qty) targetItem.shortfall_qty = payload.shortfall_qty;
  if (payload.note) targetItem.note = payload.note;

  const checklist = tripChecklistsState[targetTripId];
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
    await db.mutationQueue.add({
      tripId: targetTripId,
      entityType: "item",
      actionType: "VERIFY_ITEM",
      payload: {
        idempotency_key: idempotencyKey,
        entity_type: "loading_checklist",
        action: "verify",
        item_id: itemId,
        status: payload.status,
        shortfall_qty: payload.shortfall_qty,
        note: payload.note,
        client_timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
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

  return {
    success: true,
    trip_id: tripId,
    status: "dispatched",
    departed_at: new Date().toISOString(),
  };
}

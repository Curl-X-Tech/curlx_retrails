import { getInMemoryCurrentRoute, updateInMemoryCurrentRoute } from "@/api/driver/mock";
import { updateOrderStatusMock } from "@/api/orders/mock";
import { db } from "@/lib/dexie-db";
import type {
  ArriveRequest,
  DiscrepancyReport,
  LogDiscrepancyRequest,
  ProofOfDelivery,
  SubmitPodRequest,
} from "./types";

const MAX_SIGNATURE_SIZE_BYTES = 100 * 1024; // 100 KB limit for signature capture
const MAX_PHOTO_SIZE_BYTES = 200 * 1024; // 200 KB limit for photo proof capture

const discrepancyStore: DiscrepancyReport[] = [];
const podStore: ProofOfDelivery[] = [];

function getActiveUserId(): string {
  try {
    const session = localStorage.getItem("curlx_retrails_auth");
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.user?.id || "driver-01";
    }
  } catch (err) {
    // Fallback
  }
  return "driver-01";
}

export async function recordArrivalMock(
  waypointId: string,
  payload: ArriveRequest
): Promise<{ success: boolean; waypoint_id: string; status: string }> {
  const currentRoute = getInMemoryCurrentRoute();
  const waypoint = currentRoute.waypoints.find(
    (w) =>
      w.id === waypointId || w.route_leg_id === waypointId || String(w.seq) === waypointId
  );

  if (!waypoint) {
    throw new Error(`Waypoint ${waypointId} not found in current route`);
  }

  const prevPending = currentRoute.waypoints.find(
    (w) => w.seq < waypoint.seq && w.status === "pending"
  );
  if (prevPending) {
    throw new Error(
      `Cannot arrive at stop #${waypoint.seq} before stop #${prevPending.seq} is completed`
    );
  }

  const arrivedAt = payload.arrived_at || new Date().toISOString();
  waypoint.status = "arrived";
  waypoint.arrived_at = arrivedAt;
  currentRoute.active_waypoint_seq = waypoint.seq;
  updateInMemoryCurrentRoute(currentRoute);

  const idempotencyKey = crypto.randomUUID();
  await db.mutationQueue.put({
    idempotencyKey,
    tripId: currentRoute.trip.id,
    entityType: "route_leg",
    actionType: "UPDATE_ARRIVE",
    payload: { waypoint_id: waypoint.route_leg_id, ...payload, arrived_at: arrivedAt },
    timestamp: arrivedAt,
    syncStatus: "pending",
    retryCount: 0,
  } as unknown as Parameters<typeof db.mutationQueue.put>[0]);

  return { success: true, waypoint_id: waypoint.route_leg_id, status: "arrived" };
}

export async function submitPodMock(
  waypointId: string,
  payload: SubmitPodRequest
): Promise<ProofOfDelivery> {
  const currentRoute = getInMemoryCurrentRoute();
  const waypoint = currentRoute.waypoints.find(
    (w) =>
      w.id === waypointId || w.route_leg_id === waypointId || String(w.seq) === waypointId
  );

  if (!waypoint) {
    throw new Error(`Waypoint ${waypointId} not found in current route`);
  }

  if (waypoint.status !== "arrived" && !waypoint.arrived_at) {
    throw new Error(
      `Must record arrival at stop #${waypoint.seq} before submitting Proof of Delivery`
    );
  }

  if (
    payload.signature_data_url &&
    payload.signature_data_url.length > MAX_SIGNATURE_SIZE_BYTES
  ) {
    throw new Error(
      `Signature payload size exceeds max limit of ${MAX_SIGNATURE_SIZE_BYTES / 1024} KB`
    );
  }

  if (payload.photo_proof_url && payload.photo_proof_url.length > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(
      `Photo proof payload size exceeds max limit of ${MAX_PHOTO_SIZE_BYTES / 1024} KB`
    );
  }

  const completedAt = payload.completed_at || new Date().toISOString();
  const pod: ProofOfDelivery = {
    id: `pod-${Date.now()}`,
    route_leg_id: waypoint.route_leg_id,
    order_id: waypoint.order_summary.order_id,
    recipient_name: payload.recipient_name,
    signature_data_url: payload.signature_data_url,
    photo_proof_url: payload.photo_proof_url,
    arrived_at: waypoint.arrived_at || payload.arrived_at,
    completed_at: completedAt,
  };
  podStore.push(pod);

  waypoint.status = "completed";
  waypoint.completed_at = completedAt;
  waypoint.order_summary.items.forEach((item) => {
    item.status = "delivered";
  });

  if (payload.discrepancies && payload.discrepancies.length > 0) {
    payload.discrepancies.forEach((disc) => {
      discrepancyStore.push({
        id: `disc-${Date.now()}-${disc.item_id}`,
        pod_id: pod.id,
        item_id: disc.item_id,
        issue_type: disc.issue_type,
        reported_qty: disc.reported_qty,
        notes: disc.notes,
      });
      const targetItem = waypoint.order_summary.items.find((i) => i.id === disc.item_id);
      if (targetItem) {
        targetItem.status = "discrepancy";
      }
    });
  }

  const allCompleted = currentRoute.waypoints.every((w) => w.status === "completed");
  if (allCompleted) {
    currentRoute.trip.status = "completed";
    currentRoute.waypoints.forEach((w) => {
      void updateOrderStatusMock(w.order_summary.order_id, {
        status: "delivered",
        notes: `Trip ${currentRoute.trip.trip_code} completed`,
      }).catch(() => {});
    });
  } else {
    const nextWp = currentRoute.waypoints.find((w) => w.status === "pending");
    if (nextWp) {
      currentRoute.active_waypoint_seq = nextWp.seq;
    }
  }

  updateInMemoryCurrentRoute(currentRoute);

  const idempotencyKey = crypto.randomUUID();
  await db.mutationQueue.put({
    idempotencyKey,
    tripId: currentRoute.trip.id,
    entityType: "proof_of_delivery",
    actionType: "CREATE_POD",
    payload: { ...pod, discrepancies: payload.discrepancies },
    timestamp: completedAt,
    syncStatus: "pending",
    retryCount: 0,
    userId: getActiveUserId(),
  } as unknown as Parameters<typeof db.mutationQueue.put>[0]);

  return pod;
}

export async function logDiscrepancyMock(
  waypointId: string,
  payload: LogDiscrepancyRequest
): Promise<DiscrepancyReport> {
  const currentRoute = getInMemoryCurrentRoute();
  const waypoint = currentRoute.waypoints.find(
    (w) =>
      w.id === waypointId || w.route_leg_id === waypointId || String(w.seq) === waypointId
  );

  const matchedPod = podStore.find((p) => p.route_leg_id === waypoint?.route_leg_id);
  const report: DiscrepancyReport = {
    id: `disc-${Date.now()}`,
    pod_id: matchedPod?.id || `pod-pending-${waypointId}`,
    item_id: payload.item_id,
    issue_type: payload.issue_type,
    reported_qty: payload.reported_qty,
    notes: payload.notes,
  };
  discrepancyStore.push(report);

  if (waypoint) {
    const item = waypoint.order_summary.items.find((i) => i.id === payload.item_id);
    if (item) {
      item.status = "discrepancy";
    }
    updateInMemoryCurrentRoute(currentRoute);
  }

  const idempotencyKey = crypto.randomUUID();
  await db.mutationQueue.put({
    idempotencyKey,
    tripId: currentRoute?.trip.id || "trip-unknown",
    entityType: "proof_of_delivery",
    actionType: "LOG_DISCREPANCY",
    payload: { waypoint_id: waypointId, ...report },
    timestamp: new Date().toISOString(),
    syncStatus: "pending",
    retryCount: 0,
    userId: getActiveUserId(),
  } as unknown as Parameters<typeof db.mutationQueue.put>[0]);

  return report;
}

import { mockDelay } from "@/api/_mock-delay";
import { getInMemoryCurrentRoute, updateInMemoryCurrentRoute } from "@/api/driver/mock";
import { updateOrderStatusMock } from "@/api/orders/mock";
import { enqueue } from "@/sync/queue";
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
  } catch {
    // Fallback
  }
  return "driver-01";
}

export async function arriveWaypointMock(
  waypointId: string,
  payload: ArriveRequest
): Promise<{ success: boolean; waypoint_id: string; status: "arrived" }> {
  await mockDelay();
  const currentRoute = getInMemoryCurrentRoute();
  let waypoint = currentRoute.waypoints.find(
    (w) =>
      w.id === waypointId || w.route_leg_id === waypointId || String(w.seq) === waypointId
  );

  if (!waypoint) {
    waypoint = {
      id: waypointId,
      route_leg_id: waypointId,
      seq: currentRoute.waypoints.length + 1,
      outlet_id: "outlet-dynamic",
      outlet_name: "Delivery Outlet",
      address: "Delivery Point",
      lat: 6.9271,
      lng: 79.8612,
      contact_name: "Store Manager",
      contact_number: "+94 77 123 4567",
      delivery_window: "08:00-17:00",
      status: "pending",
      order_summary: {
        order_id: `ord-${waypointId}`,
        order_ref: `ORD-${waypointId.slice(0, 8)}`,
        total_weight_kg: 100,
        total_crate_count: 4,
        items: [],
      },
    };
    currentRoute.waypoints.push(waypoint);
  }

  const prevPending = currentRoute.waypoints.find(
    (w) => w.seq < waypoint.seq && w.status !== "completed"
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
  await enqueue({
    idempotency_key: idempotencyKey,
    entity_type: "route_leg",
    action: "update",
    payload: {
      waypoint_id: waypoint.route_leg_id,
      trip_id: currentRoute.trip.id,
      seq: waypoint.seq,
      ...payload,
      arrived_at: arrivedAt,
    },
    client_timestamp: arrivedAt,
    user_id: getActiveUserId(),
  });

  return { success: true, waypoint_id: waypoint.route_leg_id, status: "arrived" };
}

export async function submitPodMock(
  waypointId: string,
  payload: SubmitPodRequest
): Promise<ProofOfDelivery> {
  await mockDelay();
  const currentRoute = getInMemoryCurrentRoute();
  let waypoint = currentRoute.waypoints.find(
    (w) =>
      w.id === waypointId || w.route_leg_id === waypointId || String(w.seq) === waypointId
  );

  if (!waypoint) {
    waypoint = {
      id: waypointId,
      route_leg_id: waypointId,
      seq: currentRoute.waypoints.length + 1,
      outlet_id: "outlet-dynamic",
      outlet_name: payload.recipient_name || "Delivery Outlet",
      address: "Delivery Point",
      lat: 6.9271,
      lng: 79.8612,
      contact_name: payload.recipient_name || "Store Manager",
      contact_number: "+94 77 123 4567",
      delivery_window: "08:00-17:00",
      status: "arrived",
      order_summary: {
        order_id: `ord-${waypointId}`,
        order_ref: `ORD-${waypointId.slice(0, 8)}`,
        total_weight_kg: 100,
        total_crate_count: 4,
        items: [],
      },
    };
    currentRoute.waypoints.push(waypoint);
  }

  if (
    payload.signature_data_url &&
    payload.signature_data_url.length > MAX_SIGNATURE_SIZE_BYTES
  ) {
    throw new Error("Signature image payload exceeds maximum allowed size of 100 KB");
  }

  if (payload.photo_proof_url && payload.photo_proof_url.length > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Photo proof payload exceeds maximum allowed size of 200 KB");
  }

  if (payload.discrepancies && payload.discrepancies.length > 0) {
    for (const disc of payload.discrepancies) {
      await logDiscrepancyMock(waypointId, disc);
    }
  }

  const completedAt = payload.completed_at || new Date().toISOString();
  const pod: ProofOfDelivery = {
    id: `pod-${Date.now()}`,
    route_leg_id: waypoint.route_leg_id,
    order_id: waypoint.order_summary.order_id,
    recipient_name: payload.recipient_name,
    signature_data_url: payload.signature_data_url,
    photo_proof_url: payload.photo_proof_url,
    arrived_at: payload.arrived_at || waypoint.arrived_at || completedAt,
    completed_at: completedAt,
  };

  podStore.push(pod);
  waypoint.status = "completed";
  waypoint.completed_at = completedAt;

  updateOrderStatusMock(waypoint.order_summary.order_id, {
    status: "delivered",
  });

  const nextWaypoint = currentRoute.waypoints.find((w) => w.seq === waypoint.seq + 1);
  if (nextWaypoint && nextWaypoint.status === "pending") {
    nextWaypoint.status = "arrived";
    currentRoute.active_waypoint_seq = nextWaypoint.seq;
  } else if (!nextWaypoint) {
    currentRoute.trip.status = "completed";
  }

  updateInMemoryCurrentRoute(currentRoute);

  const idempotencyKey = crypto.randomUUID();
  await enqueue({
    idempotency_key: idempotencyKey,
    entity_type: "proof_of_delivery",
    action: "create",
    payload: {
      ...pod,
      trip_id: currentRoute.trip.id,
      discrepancies: payload.discrepancies,
    },
    client_timestamp: completedAt,
    user_id: getActiveUserId(),
  });

  return pod;
}

export async function logDiscrepancyMock(
  waypointId: string,
  payload: LogDiscrepancyRequest
): Promise<DiscrepancyReport> {
  await mockDelay();
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
  await enqueue({
    idempotency_key: idempotencyKey,
    entity_type: "proof_of_delivery",
    action: "create",
    payload: {
      waypoint_id: waypointId,
      trip_id: currentRoute?.trip.id || "trip-unknown",
      ...report,
    },
    client_timestamp: new Date().toISOString(),
    user_id: getActiveUserId(),
  });

  return report;
}

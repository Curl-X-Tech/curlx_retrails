import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCurrentRoute, type CurrentRouteWaypoint } from "@/api/driver";
import { useSubmitPod, useLogDiscrepancy } from "@/api/deliveries";

const FALLBACK_WAYPOINT: CurrentRouteWaypoint = {
  id: "leg-fallback",
  route_leg_id: "leg-fallback",
  seq: 1,
  outlet_id: "OUT001",
  outlet_name: "Loading...",
  address: "Address",
  lat: 6.9,
  lng: 79.8,
  contact_name: "Store Manager",
  contact_number: "+94 77 000 0000",
  delivery_window: "08:00 AM",
  status: "pending",
  order_summary: {
    order_id: "ord-fallback",
    order_ref: "ORD-000",
    total_weight_kg: 0,
    total_crate_count: 0,
    items: [],
  },
};

export function useDriverUnloading() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: route } = useCurrentRoute();
  const submitPodMutation = useSubmitPod();
  const logDiscrepancyMutation = useLogDiscrepancy();

  const waypoints = route?.waypoints ?? [];
  const queryWpSeq = Number(searchParams.get("wp"));

  const targetWp =
    (queryWpSeq && waypoints.find((w) => w.seq === queryWpSeq)) ||
    waypoints.find((w) => w.status === "arrived") ||
    waypoints.find((w) => w.status === "pending") ||
    waypoints[0] ||
    FALLBACK_WAYPOINT;

  const items = React.useMemo(() => {
    return targetWp.order_summary.items;
  }, [targetWp]);

  const [verifiedItems, setVerifiedItems] = React.useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const [isFlagModalOpen, setIsFlagModalOpen] = React.useState(false);
  const [flaggedItemId, setFlaggedItemId] = React.useState<string | null>(null);
  const [flagReason, setFlagReason] = React.useState<string>("Damaged crates on arrival");

  const [isPodModalOpen, setIsPodModalOpen] = React.useState(false);
  const [podMode, setPodMode] = React.useState<"signature" | "photo">("signature");

  React.useEffect(() => {
    if (targetWp) {
      if (targetWp.status === "completed") {
        setVerifiedItems(new Set(targetWp.order_summary.items.map((i) => i.id)));
      } else {
        setVerifiedItems(new Set());
      }
      if (targetWp.order_summary.items.length > 0) {
        setExpandedItems(new Set([targetWp.order_summary.items[0].id]));
      }
    }
  }, [targetWp]);

  const toggleItemVerification = (itemId: string) => {
    setVerifiedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleOpenFlagModal = (itemId?: string) => {
    setFlaggedItemId(itemId || null);
    setIsFlagModalOpen(true);
  };

  const handleConfirmFlagIssue = async () => {
    if (targetWp && flaggedItemId) {
      await logDiscrepancyMutation.mutateAsync({
        waypointId: targetWp.route_leg_id,
        payload: {
          item_id: flaggedItemId,
          issue_type: "damaged_in_transit",
          reported_qty: 1,
          notes: flagReason,
        },
      });
    }
    setIsFlagModalOpen(false);
    setFlaggedItemId(null);
  };

  const handleFinalDeliveryConfirm = async (
    recipientName: string = "Store Manager",
    signatureDataUrl: string = "data:image/svg+xml;base64,mock"
  ) => {
    if (!targetWp) return;

    const now = new Date().toISOString();
    await submitPodMutation.mutateAsync({
      waypointId: targetWp.route_leg_id,
      payload: {
        recipient_name: recipientName,
        signature_data_url: signatureDataUrl,
        arrived_at: targetWp.arrived_at || now,
        completed_at: now,
      },
    });

    setIsPodModalOpen(false);

    const nextWp = waypoints.find(
      (w) => w.seq > targetWp.seq && w.status !== "completed"
    );
    if (nextWp) {
      navigate(`/driver/active?wp=${nextWp.seq}`);
    } else {
      navigate("/driver/active");
    }
  };

  return {
    currentWp: targetWp,
    targetWp,
    items,
    verifiedItems,
    expandedItems,
    isFlagModalOpen,
    flaggedItemId,
    flagReason,
    isPodModalOpen,
    podMode,
    setIsFlagModalOpen,
    setFlagReason,
    setIsPodModalOpen,
    setPodMode,
    toggleItemVerification,
    toggleExpandItem,
    handleOpenFlagModal,
    handleConfirmFlagIssue,
    handleFinalDeliveryConfirm,
  };
}

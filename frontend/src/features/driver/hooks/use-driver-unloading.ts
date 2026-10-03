import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import type { DriverWaypoint, DriverTrip } from "../types";
import { useOfflineActiveTrip } from "./use-offline-trip";

export function useDriverUnloading() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeStop, verifyPackage } = useOfflineActiveTrip();

  const [trip, setTrip] = React.useState<DriverTrip>(mockDriverTrip);
  const waypoints = trip.waypoints;

  const queryWpSeq = Number(searchParams.get("wp"));
  const targetWp =
    (queryWpSeq && waypoints.find((w) => w.seq === queryWpSeq)) ||
    waypoints.find((w) => w.status === "active") ||
    waypoints[0];

  const [currentWp, setCurrentWp] = React.useState<DriverWaypoint>(targetWp);
  const [verifiedItems, setVerifiedItems] = React.useState<Set<string>>(() => {
    if (targetWp.status === "completed") {
      return new Set(targetWp.items.map((i) => i.id));
    }
    return new Set();
  });
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    if (targetWp.items.length > 0) {
      return new Set([targetWp.items[0].id]);
    }
    return new Set();
  });

  const [isFlagModalOpen, setIsFlagModalOpen] = React.useState(false);
  const [flaggedItemId, setFlaggedItemId] = React.useState<string | null>(null);
  const [flagReason, setFlagReason] = React.useState<string>("Damaged crates on arrival");

  const [isPodModalOpen, setIsPodModalOpen] = React.useState(false);
  const [podMode, setPodMode] = React.useState<"signature" | "photo">("signature");

  React.useEffect(() => {
    if (targetWp) {
      setCurrentWp(targetWp);
      if (targetWp.status === "completed") {
        setVerifiedItems(new Set(targetWp.items.map((i) => i.id)));
      }
    }
  }, [targetWp]);

  const toggleItemVerification = (itemId: string) => {
    const isNowVerified = !verifiedItems.has(itemId);
    setVerifiedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    const foundItem = currentWp.items.find((i) => i.id === itemId);
    const code = foundItem?.packageCode || itemId;
    void verifyPackage(code, isNowVerified ? "delivered" : "delivered");
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

  const handleConfirmFlagIssue = () => {
    if (flaggedItemId) {
      setCurrentWp((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === flaggedItemId ? { ...i, status: "discrepancy" as const } : i
        ),
      }));
      const foundItem = currentWp.items.find((i) => i.id === flaggedItemId);
      const code = foundItem?.packageCode || flaggedItemId;
      void verifyPackage(code, "discrepancy", flagReason);
    }
    setIsFlagModalOpen(false);
    setFlaggedItemId(null);
  };

  const handleFinalDeliveryConfirm = () => {
    setTrip((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((w) =>
        w.seq === currentWp.seq ? { ...w, status: "completed" as const } : w
      ),
    }));

    void completeStop(currentWp.seq);
    setIsPodModalOpen(false);

    const nextWp = waypoints.find(
      (w) => w.seq > currentWp.seq && w.status !== "completed"
    );
    if (nextWp) {
      navigate(`/driver/active?wp=${nextWp.seq}`);
    } else {
      navigate("/driver/active");
    }
  };

  return {
    currentWp,
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

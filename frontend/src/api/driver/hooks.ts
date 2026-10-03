import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { driverKeys } from "../keys";
import { getCurrentRoute } from "./api";
import type { TripProgressSummary } from "./types";
import { db } from "@/lib/dexie-db";

export function useCurrentRoute() {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return useQuery({
    queryKey: driverKeys.currentRoute(),
    queryFn: () => getCurrentRoute(),
    staleTime: 1000 * 60 * 5,
    networkMode: "offlineFirst",
    refetchOnWindowFocus: isOnline,
    refetchInterval: isOnline ? 30000 : false,
  });
}

export function useTripProgress(): TripProgressSummary {
  const { data: route } = useCurrentRoute();
  const queuedMutations = useLiveQuery(
    () => db.mutationQueue.where("status").anyOf(["queued", "sending"]).toArray(),
    []
  );

  const waypoints = route?.waypoints ?? [];
  const completedCount = waypoints.filter((w) => w.status === "completed").length;
  const totalStops = waypoints.length;
  const remainingStops = Math.max(0, totalStops - completedCount);
  const progressPct =
    totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;
  const nextStop = waypoints.find((w) => w.status === "pending") ?? null;
  const currentWp =
    waypoints.find((w) => w.status === "arrived") ??
    waypoints.find((w) => w.seq === route?.active_waypoint_seq) ??
    nextStop;

  return {
    completed_stops: completedCount,
    total_stops: totalStops,
    remaining_stops: remainingStops,
    progress_pct: progressPct,
    next_stop: nextStop,
    current_waypoint: currentWp,
    queued_mutations_count: queuedMutations?.length ?? 0,
  };
}

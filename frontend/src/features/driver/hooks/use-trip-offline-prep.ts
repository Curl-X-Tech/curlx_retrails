import * as React from "react";
import { useCurrentRoute } from "@/api/driver";
import { executeDownloadTrip } from "../download-trip-helper";

export type TripPrepStatus = "idle" | "preparing" | "ready" | "failed";

export function useTripOfflinePrep(): { status: TripPrepStatus } {
  const { data: route } = useCurrentRoute();
  const [status, setStatus] = React.useState<TripPrepStatus>("idle");

  React.useEffect(() => {
    if (!route?.trip?.id) return;

    const tripId = route.trip.id;
    const storageKey = `trip-prepared:${tripId}`;

    if (localStorage.getItem(storageKey) === "true") {
      setStatus("ready");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("idle");
      return;
    }

    let isMounted = true;
    setStatus("preparing");

    executeDownloadTrip(tripId, route)
      .then((success) => {
        if (!isMounted) return;
        if (success) {
          localStorage.setItem(storageKey, "true");
          setStatus("ready");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => {
        if (isMounted) setStatus("failed");
      });

    return () => {
      isMounted = false;
    };
  }, [route]);

  return { status };
}

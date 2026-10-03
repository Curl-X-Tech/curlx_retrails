import * as React from "react";
import { useLocation } from "react-router-dom";

/**
 * Resolves the simulated delay in milliseconds.
 * Priority order:
 * 1. URL search query parameter `?delay=X` (supports seconds like `?delay=1.5` or ms like `?delay=500ms` or `?delay=0`)
 * 2. `import.meta.env.VITE_SIMULATED_DELAY_SEC` (in seconds)
 * 3. Default fallback: 1000 ms (1 second)
 */
function getSimulatedDelayMs(search?: string | URLSearchParams): number {
  if (typeof window !== "undefined") {
    const params =
      typeof search === "string"
        ? new URLSearchParams(search)
        : search || new URLSearchParams(window.location.search);

    const delayParam = params.get("delay");
    if (delayParam !== null && delayParam !== undefined && delayParam.trim() !== "") {
      const trimmed = delayParam.trim().toLowerCase();
      if (trimmed.endsWith("ms")) {
        const parsedMs = parseFloat(trimmed.replace("ms", ""));
        if (!isNaN(parsedMs) && parsedMs >= 0) return parsedMs;
      }
      const parsedSec = parseFloat(trimmed);
      if (!isNaN(parsedSec) && parsedSec >= 0) {
        return parsedSec * 1000;
      }
    }
  }

  const envDelaySec = import.meta.env.VITE_SIMULATED_DELAY_SEC;
  if (
    envDelaySec !== undefined &&
    envDelaySec !== null &&
    String(envDelaySec).trim() !== ""
  ) {
    const parsedEnv = parseFloat(String(envDelaySec));
    if (!isNaN(parsedEnv) && parsedEnv >= 0) {
      return parsedEnv * 1000;
    }
  }

  return 1000; // 1 second default
}

/**
 * Hook to simulate loading states when filter/search/pagination dependencies change.
 */
export function useSimulatedLoading(
  deps: React.DependencyList = [],
  customDelayMs?: number
): boolean {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const delayMs = customDelayMs ?? getSimulatedDelayMs(location.search);
    if (delayMs <= 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delayMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, ...deps]);

  return isLoading;
}

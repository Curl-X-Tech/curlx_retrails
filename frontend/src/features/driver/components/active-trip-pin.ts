import L from "leaflet";
import type { DriverWaypoint } from "../types";

export function createDriverWaypointPin(seq: number, status: DriverWaypoint["status"]) {
  let bg = "#0070BA";
  let extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";

  if (status === "completed") {
    bg = "#059669";
  } else if (status === "active") {
    bg = "#0070BA";
    extraGlow =
      "box-shadow: 0 0 0 3px rgba(0, 112, 186, 0.4), 0 3px 8px rgba(0,0,0,0.3);";
  } else {
    bg = "#0369A1";
  }

  return L.divIcon({
    className: `driver-waypoint-pin-${status}`,
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: ${bg}; color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 900; border: 2px solid #ffffff; line-height: 1; ${extraGlow} cursor: pointer;">
        ${seq}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

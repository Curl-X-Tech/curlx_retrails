import L from "leaflet";
import type { AllocationWaypoint } from "@/data/mock-allocation-details";
import { getVehicleConfig } from "@/lib/map-themes";

export type WaypointCategory = "completed" | "upcoming" | "newly_added";

export function getWaypointCategory(
  status: AllocationWaypoint["status"]
): WaypointCategory {
  if (status === "completed") return "completed";
  if (status === "newly_added") return "newly_added";
  return "upcoming";
}

export function createWaypointPin(
  seq: number,
  category: WaypointCategory,
  isHub: boolean = false
) {
  let bg = "#0070BA";
  let extraGlow = "";

  if (isHub) {
    bg = "#0069A8";
    extraGlow = "box-shadow: 0 2px 8px rgba(0,0,0,0.3);";
  } else if (category === "completed") {
    bg = "#059669";
    extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";
  } else if (category === "newly_added") {
    bg = "#7C3AED";
    extraGlow =
      "box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.4), 0 3px 8px rgba(0,0,0,0.3);";
  } else {
    extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";
  }

  return L.divIcon({
    className: `custom-waypoint-${category}`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: ${bg}; color: #ffffff; font-family: sans-serif; font-size: 12px; font-weight: 800; border: 2px solid #ffffff; line-height: 1; ${extraGlow}">
          ${isHub ? "H" : seq}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function createTopViewMarker(
  unitId: string,
  vehicleModel: string = "truck",
  heading: number = 0
) {
  const cfg = getVehicleConfig(vehicleModel);

  return L.divIcon({
    className: "custom-topview-vehicle-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <div style="background: rgba(255, 255, 255, 0.96); color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 700; font-family: sans-serif; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.18); margin-bottom: 2px;">
          ${unitId}
        </div>
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <img 
            src="${cfg.iconUrl}" 
            alt="${unitId}" 
            style="width: ${cfg.imgWidth}px; height: ${cfg.imgHeight}px; object-fit: contain; transform: rotate(${heading}deg); transform-origin: center center; filter: drop-shadow(0px 8px 8px rgba(0, 0, 0, 0.42)); display: block;" 
          />
        </div>
      </div>
    `,
    iconSize: [cfg.iconWidth, cfg.iconHeight],
    iconAnchor: [cfg.anchorX, cfg.anchorY],
  });
}

import L from "leaflet";
import {
  type StoreLocation,
  type VehicleTrackingData,
  getVehicleConfig,
} from "@/data/mock-live-map";

export function createHubIcon() {
  return L.divIcon({
    className: "custom-hub-icon",
    html: `
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #0069A8; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
          <path d="M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function createTopViewVehicleIcon(vehicle: VehicleTrackingData) {
  const cfg = getVehicleConfig(vehicle.vehicleType);
  const heading = vehicle.heading || 0;

  return L.divIcon({
    className: "custom-topview-vehicle-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <div style="background: rgba(255, 255, 255, 0.96); color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 700; font-family: sans-serif; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.18); margin-bottom: 2px;">
          ${vehicle.code}
        </div>
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <img 
            src="${cfg.iconUrl}" 
            alt="${vehicle.code}" 
            style="width: ${cfg.imgWidth}px; height: ${cfg.imgHeight}px; object-fit: contain; transform: rotate(${heading}deg); transform-origin: center center; filter: drop-shadow(0px 8px 8px rgba(0, 0, 0, 0.42)); display: block;" 
          />
        </div>
      </div>
    `,
    iconSize: [cfg.iconWidth, cfg.iconHeight],
    iconAnchor: [cfg.anchorX, cfg.anchorY],
  });
}

export function createStoreIcon(store: StoreLocation) {
  let iconSvg = "";
  let bg = "#0069A8";

  if (store.category === "fresh") {
    bg = "#059669";
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
        <path d="M223.41,32.59a8,8,0,0,0-7.77-2c-35.91,7.74-72.23,30.34-97.16,60.47C93.44,121.36,80,154.51,80,192a8,8,0,0,0,8,8c37.49,0,70.64-13.44,100.94-38.48,30.13-24.93,52.73-61.25,60.47-97.16A8,8,0,0,0,223.41,32.59ZM178.6,150.2c-23.75,20.08-50.41,32-80.6,33.64C99.64,153.65,111.56,127,131.64,103.25c21.2-25.62,51.81-45.24,82.4-53.19C206.09,80.65,186.47,111.26,178.6,150.2ZM72,208a8,8,0,0,1-8,8A48.05,48.05,0,0,1,16,168a8,8,0,0,1,16,0,32,32,0,0,0,32,32A8,8,0,0,1,72,208Z"/>
      </svg>
    `;
  } else if (store.category === "pharmacy") {
    bg = "#7C3AED";
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,80H184V40a16,16,0,0,0-16-16H88A16,16,0,0,0,72,40V80H32A16,16,0,0,0,16,96V208a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V96A16,16,0,0,0,224,80ZM88,40h80V80H88ZM152,144H136v16a8,8,0,0,1-16,0V144H104a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16a8,8,0,0,1,0,16Z"/>
      </svg>
    `;
  } else if (store.category === "chilled") {
    bg = "#0284C7";
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,120H180.24l22.75-22.75a8,8,0,0,0-11.32-11.31L168,110V70.24l22.75-22.75a8,8,0,0,0-11.31-11.32L156,59.55V32a8,8,0,0,0-16,0V69.76L117.25,47a8,8,0,0,0-11.32,11.31L128.69,81H88V40a8,8,0,0,0-16,0V81H32a8,8,0,0,0,0,16H72.69l-22.76,22.75a8,8,0,0,0,11.32,11.31L84,108.31V148H44a8,8,0,0,0,0,16H84v40.69l-22.75,22.75a8,8,0,0,0,11.31,11.32L95.31,216H136v40a8,8,0,0,0,16,0V216h40.69l22.75,22.75a8,8,0,0,0,11.32-11.32L204.69,204.69,173.31,173.31A8,8,0,0,0,162,162L136,188V148h40a8,8,0,0,0,0-16H136V92l26-26a8,8,0,0,0,0-11.31L136,28.69V120Z"/>
      </svg>
    `;
  } else {
    bg = "#0069A8";
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
        <path d="M239.71,81.14l-16-48A8,8,0,0,0,216.12,28H39.88a8,8,0,0,0-7.59,5.14l-16,48A8,8,0,0,0,24,96v16a8,8,0,0,0,8,8v96a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V120a8,8,0,0,0,8-8V96A8,8,0,0,0,239.71,81.14ZM45.72,44H210.28l10.67,32H35.05ZM208,216H48V120H208Zm16-112H32V92H224Z"/>
      </svg>
    `;
  }

  return L.divIcon({
    className: "custom-store-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 30px; height: 30px; border-radius: 9px; background: ${bg}; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 7px rgba(0,0,0,0.25); border: 2px solid #ffffff;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

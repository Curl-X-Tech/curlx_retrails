/**
 * ReTrails Map Tile Offline Prefetcher
 * Converts GPS lat/lng coordinates to standard Web Mercator Slippy Map tile coordinates
 * and pre-caches surrounding tile grids into the PWA Cache Storage for full offline navigation.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export function latLngToTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number; z: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y, z: zoom };
}

/**
 * Downloads and caches map tiles surrounding the provided route waypoints
 * across zoom levels [12, 13, 14, 15] for offline Leaflet rendering.
 */
export async function prefetchTripMapTiles(
  coords: LatLng[],
  zoomLevels = [12, 13, 14, 15]
): Promise<number> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return 0;
  }

  const subdomains = ["a", "b", "c", "d"];
  const tileUrls = new Set<string>();

  for (const zoom of zoomLevels) {
    for (const point of coords) {
      if (!point.lat || !point.lng) continue;
      const tile = latLngToTile(point.lat, point.lng, zoom);

      // Fetch 3x3 surrounding tile grid around each waypoint
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = tile.x + dx;
          const y = tile.y + dy;
          const s = subdomains[Math.abs(x + y) % subdomains.length];
          const url = `https://${s}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
          tileUrls.add(url);
        }
      }
    }
  }

  try {
    const cache = await caches.open("carto-map-tiles");
    const promises = Array.from(tileUrls).map(async (url) => {
      try {
        const match = await cache.match(url);
        if (!match) {
          const response = await fetch(url, { mode: "cors" });
          if (response.ok) {
            await cache.put(url, response);
          }
        }
      } catch {
        // Ignore individual network tile failures
      }
    });

    await Promise.allSettled(promises);
    return tileUrls.size;
  } catch {
    return 0;
  }
}

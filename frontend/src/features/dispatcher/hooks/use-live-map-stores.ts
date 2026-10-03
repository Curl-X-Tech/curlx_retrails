import * as React from "react";
import { useBrands, useDistricts, useOutlets, type BrandCode } from "@/api/master";
import type { BrandName, StoreLocation } from "@/types";

const BRAND_NAMES: Record<BrandCode, BrandName> = {
  FRESH: "Fresh",
  STYLE: "Style",
  TECH: "Tech",
};

const toWallClock = (time: string) => time.slice(0, 5);

export function useLiveMapStores() {
  const outletsQuery = useOutlets({ is_active: true });
  const { data: brands = [] } = useBrands();
  const { data: districts = [] } = useDistricts();

  const stores = React.useMemo<StoreLocation[]>(() => {
    const brandCode = new Map(brands.map((b) => [b.id, b.code]));
    const districtName = new Map(districts.map((d) => [d.id, d.name]));
    return (outletsQuery.data ?? []).flatMap((o) => {
      const code = brandCode.get(o.brand_id);
      if (o.latitude === null || o.longitude === null || !code) return [];
      return [
        {
          id: o.id,
          code: o.outlet_id,
          outletId: o.outlet_id,
          name: o.name,
          brand: BRAND_NAMES[code],
          district: districtName.get(o.district_id),
          dockType: o.dock_type,
          parkingConstraint: o.parking_constraint,
          address: "",
          lat: o.latitude,
          lng: o.longitude,
          contactPhone: o.contact_phone ?? "",
          todayStatus: "scheduled",
          cratesScheduled: 0,
          deliveryWindow: `${toWallClock(o.window_open_time)} - ${toWallClock(o.window_close_time)}`,
        },
      ];
    });
  }, [outletsQuery.data, brands, districts]);

  return { stores, isLoading: outletsQuery.isLoading, error: outletsQuery.error };
}

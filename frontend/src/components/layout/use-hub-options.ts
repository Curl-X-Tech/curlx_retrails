import * as React from "react";
import { useDepots, useDistricts } from "@/api/master";

export interface HubInfo {
  id: string;
  code: string;
  name: string;
  province: string;
  active: boolean;
  latitude: number;
  longitude: number;
}

export function useHubOptions() {
  const depotsQuery = useDepots();
  const { data: districts = [] } = useDistricts();

  const hubs = React.useMemo<HubInfo[]>(() => {
    const provinceByDepot = new Map<string, string>();
    districts.forEach((d) => {
      if (!provinceByDepot.has(d.assigned_depot_id)) {
        provinceByDepot.set(d.assigned_depot_id, d.province);
      }
    });
    return (depotsQuery.data ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      province: provinceByDepot.get(d.id) ?? "",
      active: d.is_active,
      latitude: d.latitude,
      longitude: d.longitude,
    }));
  }, [depotsQuery.data, districts]);

  return { hubs, isLoading: depotsQuery.isLoading };
}

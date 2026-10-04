import * as React from "react";
import { useAuth } from "@/context/auth-context";
import {
  useActivePrices,
  useBrands,
  useDepots,
  useDistricts,
  useItems,
  useOutlets,
  type BrandCode,
} from "@/api/master";
import type { CatalogProduct, StoreOutletOption } from "../types";

const BRAND_LABELS: Record<BrandCode, CatalogProduct["brand"]> = {
  FRESH: "Fresh",
  STYLE: "Style",
  TECH: "Tech",
};

export function useOrderCatalog() {
  const { user } = useAuth();
  const outletsQuery = useOutlets({ is_active: true });
  const itemsQuery = useItems();
  const pricesQuery = useActivePrices();
  const { data: brands = [] } = useBrands();
  const { data: districts = [] } = useDistricts();
  const { data: depots = [] } = useDepots();

  const outlets = React.useMemo<StoreOutletOption[]>(() => {
    const districtName = new Map(districts.map((d) => [d.id, d.name]));
    const depotName = new Map(depots.map((d) => [d.id, d.name]));
    const allOutlets = (outletsQuery.data ?? []).map((o) => ({
      id: o.id,
      code: o.outlet_id,
      name: o.name,
      address: "",
      district: districtName.get(o.district_id) ?? "",
      depot: depotName.get(o.depot_id) ?? "",
      dockType: o.dock_type,
    }));

    if (user?.role === "store_manager") {
      const assigned = allOutlets.filter((o) => {
        if (user.outletCode && o.code === user.outletCode) return true;
        if (user.outletId && o.id === user.outletId) return true;
        if (
          user.location &&
          (user.location.includes(o.code) || user.location.includes(o.name))
        ) {
          return true;
        }
        if (user.email && user.email.includes("cargills") && o.code === "OUT-004")
          return true;
        return false;
      });

      if (assigned.length > 0) return assigned;
      // Default fallback for store manager if unassigned: return their default outlet (OUT-001)
      const defaultStore = allOutlets.filter((o) => o.code === "OUT-001");
      return defaultStore.length > 0 ? defaultStore : allOutlets.slice(0, 1);
    }

    return allOutlets;
  }, [outletsQuery.data, districts, depots, user]);

  const products = React.useMemo<CatalogProduct[]>(() => {
    const brandCode = new Map(brands.map((b) => [b.id, b.code]));
    const unitPrice = new Map(
      (pricesQuery.data ?? []).map((p) => [p.item_id, p.unit_price])
    );
    return (itemsQuery.data ?? []).flatMap((i) => {
      const price = unitPrice.get(i.id);
      const code = brandCode.get(i.brand_id);
      if (price === undefined || !code) return [];
      return [
        {
          id: i.id,
          sku: i.sku,
          name: i.name,
          category: i.category,
          brand: BRAND_LABELS[code],
          unit: i.unit as CatalogProduct["unit"],
          unitWeightKg: i.unit_weight_kg,
          unitVolumeM3: i.unit_volume_m3,
          unitPriceLkr: price,
          requiresColdChain: i.requires_cold_chain,
          specialHandlingCode: i.special_handling_code ?? undefined,
        },
      ];
    });
  }, [itemsQuery.data, pricesQuery.data, brands]);

  return {
    outlets,
    products,
    isLoading: outletsQuery.isLoading || itemsQuery.isLoading || pricesQuery.isLoading,
    error: outletsQuery.error ?? itemsQuery.error ?? pricesQuery.error,
    refetch: () => {
      outletsQuery.refetch();
      itemsQuery.refetch();
      pricesQuery.refetch();
    },
  };
}

export type OrderCatalog = ReturnType<typeof useOrderCatalog>;

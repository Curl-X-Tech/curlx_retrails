import * as React from "react";
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
  const outletsQuery = useOutlets({ is_active: true });
  const itemsQuery = useItems();
  const pricesQuery = useActivePrices();
  const { data: brands = [] } = useBrands();
  const { data: districts = [] } = useDistricts();
  const { data: depots = [] } = useDepots();

  const outlets = React.useMemo<StoreOutletOption[]>(() => {
    const districtName = new Map(districts.map((d) => [d.id, d.name]));
    const depotName = new Map(depots.map((d) => [d.id, d.name]));
    return (outletsQuery.data ?? []).map((o) => ({
      id: o.id,
      code: o.outlet_id,
      name: o.name,
      address: "",
      district: districtName.get(o.district_id) ?? "",
      depot: depotName.get(o.depot_id) ?? "",
      dockType: o.dock_type,
    }));
  }, [outletsQuery.data, districts, depots]);

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

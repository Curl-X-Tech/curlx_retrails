import { PackageIcon, SnowflakeIcon } from "@phosphor-icons/react";
import type { DataTableColumn } from "@/components/shared";
import type { MasterItem } from "../types";
import { EntityRowActions, type EntityActions } from "./entity-row-actions";

export interface ItemColumnHelpers {
  actions?: EntityActions<MasterItem>;
  getBrandCode: (brandId: string) => string;
  getActivePrice: (itemId: string) => number | null;
}

export function getItemColumns(
  helpers: ItemColumnHelpers
): DataTableColumn<MasterItem>[] {
  return [
    {
      key: "sku",
      header: "SKU & Item Name",
      sortable: true,
      className: "w-[240px] pl-4 font-bold text-foreground text-xs whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-2">
          <PackageIcon className="size-3.5 text-primary shrink-0" />
          <div>
            <div className="font-bold text-xs text-foreground">{item.name}</div>
            <div className="text-[11px] text-muted-foreground">{item.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      className: "w-[90px] whitespace-nowrap",
      render: (item) => (
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {helpers.getBrandCode(item.brand_id)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      className: "w-[120px] text-xs font-medium text-foreground whitespace-nowrap",
      render: (item) => item.category,
    },
    {
      key: "temp",
      header: "Storage Temp",
      className: "w-[120px] whitespace-nowrap",
      render: (item) =>
        item.requires_cold_chain ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
            <SnowflakeIcon className="size-3" />
            Reefer (Cold)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Ambient</span>
        ),
    },
    {
      key: "weight",
      header: "Unit Weight",
      sortable: true,
      className: "w-[100px] text-xs text-foreground font-medium whitespace-nowrap",
      render: (item) => `${item.unit_weight_kg.toFixed(2)} kg`,
    },
    {
      key: "volume",
      header: "Unit Volume",
      sortable: true,
      className: "w-[100px] text-xs text-foreground font-medium whitespace-nowrap",
      render: (item) => `${item.unit_volume_m3.toFixed(3)} m³`,
    },
    {
      key: "price",
      header: "Active Price (LKR)",
      sortable: true,
      className:
        "w-[130px] pr-4 text-right whitespace-nowrap text-xs font-bold text-foreground",
      render: (item) => {
        const price = helpers.getActivePrice(item.id);
        return price !== null ? `Rs. ${price.toLocaleString()}` : "-";
      },
    },
    ...(helpers.actions
      ? [
          {
            key: "actions",
            header: "Actions",
            className: "w-14 text-right",
            render: (row: MasterItem) => (
              <EntityRowActions row={row} actions={helpers.actions!} />
            ),
          },
        ]
      : []),
  ];
}

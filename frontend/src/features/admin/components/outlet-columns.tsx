import { StorefrontIcon, ClockIcon } from "@phosphor-icons/react";
import { CopyableId } from "@/components/shared";
import type { DataTableColumn } from "@/components/shared";
import type { MasterOutlet } from "../types";
import { EntityRowActions, type EntityActions } from "./entity-row-actions";

export interface OutletColumnHelpers {
  actions?: EntityActions<MasterOutlet>;
  getBrandCode: (brandId: string) => string;
  getDepotCode: (depotId: string) => string;
  getDistrictName: (districtId: string) => string;
}

export function getOutletColumns(
  helpers: OutletColumnHelpers
): DataTableColumn<MasterOutlet>[] {
  return [
    {
      key: "outletId",
      header: "Store ID & Name",
      sortable: true,
      className: "w-[180px] pl-4 font-bold text-foreground text-xs whitespace-nowrap",
      render: (outlet) => (
        <div className="flex items-center gap-2">
          <StorefrontIcon className="size-3.5 text-primary shrink-0" />
          <div>
            <div className="font-bold text-xs text-foreground">{outlet.name}</div>
            <div className="mt-0.5">
              <CopyableId id={outlet.outlet_id} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      className: "w-[110px] whitespace-nowrap",
      render: (outlet) => (
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {helpers.getBrandCode(outlet.brand_id)}
        </span>
      ),
    },
    {
      key: "district",
      header: "District & Hub",
      sortable: true,
      className: "w-[160px] whitespace-nowrap",
      render: (outlet) => (
        <div>
          <div className="text-xs text-foreground font-semibold">
            {helpers.getDistrictName(outlet.district_id)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Hub: {helpers.getDepotCode(outlet.depot_id)}
          </div>
        </div>
      ),
    },
    {
      key: "dock",
      header: "Dock Type",
      sortable: true,
      className: "w-[120px] text-xs capitalize text-foreground whitespace-nowrap",
      render: (outlet) =>
        outlet.dock_type === "mall_bay" ? (
          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
            Mall Bay
          </span>
        ) : (
          outlet.dock_type.replace("_", " ")
        ),
    },
    {
      key: "constraint",
      header: "Vehicle Restriction",
      sortable: true,
      className: "w-[140px] whitespace-nowrap",
      render: (outlet) =>
        outlet.parking_constraint === "van_only" ? (
          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase">
            Van Only
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Standard</span>
        ),
    },
    {
      key: "window",
      header: "Delivery Window",
      sortable: true,
      className: "w-[130px] text-xs text-foreground whitespace-nowrap",
      render: (outlet) => (
        <div className="flex items-center gap-1">
          <ClockIcon className="size-3 text-muted-foreground shrink-0" />
          <span>
            {outlet.window_open_time.slice(0, 5)} - {outlet.window_close_time.slice(0, 5)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[90px] pr-4 text-right whitespace-nowrap",
      render: (outlet) =>
        outlet.is_active ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Inactive</span>
        ),
    },
    ...(helpers.actions
      ? [
          {
            key: "actions",
            header: "Actions",
            className: "w-14 text-right",
            render: (row: MasterOutlet) => (
              <EntityRowActions row={row} actions={helpers.actions!} />
            ),
          },
        ]
      : []),
  ];
}

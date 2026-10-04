import { WarehouseIcon, MapPinIcon, CheckCircleIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EntityRowActions, type EntityActions } from "./entity-row-actions";
import type { MasterDepot, MasterDistrict, MasterOutlet } from "../types";

export interface DepotCardProps {
  depot: MasterDepot;
  districts: MasterDistrict[];
  outlets: MasterOutlet[];
  actions?: EntityActions<MasterDepot>;
}

export function DepotCard({ depot, districts, outlets, actions }: DepotCardProps) {
  const assignedDistricts = districts.filter(
    (dist) => dist.assigned_depot_id === depot.id
  );
  const assignedOutlets = outlets.filter((o) => o.depot_id === depot.id);

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="border-b border-border/60 pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted border border-border/60">
              <WarehouseIcon weight="duotone" className="size-5 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">
                  {depot.name} Distribution Center
                </CardTitle>
                <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded border border-border/60 text-foreground">
                  {depot.code}
                </span>
              </div>
              <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                <MapPinIcon className="size-3" />
                {depot.address || "Sri Lanka"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {depot.is_active && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            )}
            {actions && <EntityRowActions row={depot} actions={actions} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-1">
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Position
            </div>
            <div className="font-semibold text-xs text-foreground tabular-nums">
              {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-1">
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Assigned Outlets
            </div>
            <div className="font-semibold text-xs text-foreground tabular-nums">
              {assignedOutlets.length} Stores
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Covered Logistics Districts</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {assignedDistricts.length} Districts
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {assignedDistricts.map((dist) => (
              <span
                key={dist.id}
                className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-xs text-foreground font-medium"
              >
                {dist.name} ({dist.province})
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs space-y-1 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
            <CheckCircleIcon weight="fill" className="size-3.5 text-primary" />
            <span>Feasibility Constraint FR-05 Active</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Vehicles staged from {depot.name} must return to this hub upon completing
            daily delivery routes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

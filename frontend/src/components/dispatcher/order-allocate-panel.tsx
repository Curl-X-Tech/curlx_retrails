import * as React from "react";
import { Button } from "@/components/ui/button";
import { useManualAllocation } from "@/api/allocations";
import { useDrivers, useVehicles } from "@/api/fleet";
import { formatErrorMessage } from "@/api/errors";

interface OrderAllocatePanelProps {
  orderId: string;
  onAllocated: () => void;
}

const selectClass =
  "h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs";

function colomboToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(
    new Date()
  );
}

export function OrderAllocatePanel({ orderId, onAllocated }: OrderAllocatePanelProps) {
  const { data: vehicles = [] } = useVehicles({ is_active: true });
  const { data: drivers = [] } = useDrivers();
  const [vehicleId, setVehicleId] = React.useState("");
  const [driverId, setDriverId] = React.useState("");
  const allocate = useManualAllocation();

  const submit = () =>
    allocate.mutate(
      {
        order_ids: [orderId],
        vehicle_id: vehicleId,
        driver_id: driverId || undefined,
        operating_date: colomboToday(),
      },
      { onSuccess: onAllocated }
    );

  const handleVehicleChange = (newVehicleId: string) => {
    setVehicleId(newVehicleId);
    if (newVehicleId && !driverId) {
      const veh = vehicles.find((v) => v.id === newVehicleId);
      if (veh?.assigned_driver_id) {
        setDriverId(veh.assigned_driver_id);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <select
          aria-label="Vehicle"
          className={selectClass}
          value={vehicleId}
          disabled={allocate.isPending}
          onChange={(e) => handleVehicleChange(e.target.value)}
        >
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.reg_number} — {v.model_name || v.type.toUpperCase()} (
              {v.temp.toUpperCase()} · {v.weight_cap_kg} kg)
            </option>
          ))}
        </select>
        <select
          aria-label="Driver"
          className={selectClass}
          value={driverId}
          disabled={allocate.isPending}
          onChange={(e) => setDriverId(e.target.value)}
        >
          <option value="">Assigned driver</option>
          {drivers.map((d) => {
            const fullName =
              `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.name;
            const displayName = fullName || d.employee_code || "Driver";
            const secondary = d.email || d.license_number;
            const label = `${displayName} — ${secondary}`;

            return (
              <option key={d.id} value={d.id}>
                {label}
              </option>
            );
          })}
        </select>
        <Button
          size="sm"
          className="h-8 px-4 text-xs font-semibold cursor-pointer rounded-lg"
          disabled={!vehicleId || allocate.isPending}
          onClick={submit}
        >
          {allocate.isPending ? "Allocating..." : "Allocate"}
        </Button>
      </div>
      {allocate.isError && (
        <span role="alert" className="text-[11px] text-destructive">
          {formatErrorMessage(allocate.error, "Allocation failed.")}
        </span>
      )}
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon, CheckCircleIcon } from "@phosphor-icons/react";
import type { LoaderVehicleTrip } from "../types";

interface ManifestPrintDialogProps {
  trip: LoaderVehicleTrip | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ManifestPrintDialog({ trip, isOpen, onClose }: ManifestPrintDialogProps) {
  if (!trip) return null;

  const totalCrates = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.crateCount, 0),
    0
  );
  const totalWeight = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.weightKg, 0),
    0
  );
  const totalVolume = trip.waypoints.reduce(
    (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.volumeM3, 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 max-h-[90vh] flex flex-col bg-card overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PrinterIcon className="size-5 text-primary" weight="bold" />
            <DialogTitle className="font-heading font-black text-base text-foreground">
              Official Loading Manifest #{trip.tripCode}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            >
              <PrinterIcon className="size-3.5" weight="bold" />
              <span>Print Waybill</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="size-8.5 p-0 rounded-xl cursor-pointer"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20 print:p-0 print:bg-white text-foreground print:text-black">
          <div
            id="printable-manifest-slip"
            className="bg-card print:bg-white p-6 sm:p-8 rounded-2xl border border-border print:border-none shadow-xs text-xs space-y-6"
          >
            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b pb-4 border-border/80">
              <div>
                <h1 className="font-heading font-black text-lg sm:text-xl text-foreground print:text-black tracking-tight">
                  RETRAILS LOGISTICS
                </h1>
                <p className="text-[11px] text-muted-foreground print:text-gray-600 font-medium mt-0.5">
                  Vehicle Loading & Dispatch Verification Waybill
                </p>
                <p className="text-[11px] text-muted-foreground print:text-gray-600">
                  Depot: {trip.depotName} · Bay: {trip.dockBay}
                </p>
              </div>
              <div className="text-right">
                <div className="font-heading font-black text-base text-primary print:text-black">
                  MANIFEST #{trip.tripCode}
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600 font-medium">
                  Date: {trip.dispatchDate || currentDateStr}
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600">
                  Rollout: {trip.plannedDepartureTime}
                </div>
              </div>
            </div>

            {/* Vehicle & Pilot Meta Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 print:bg-gray-100 rounded-xl border border-border/60">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Vehicle Reg
                </span>
                <span className="font-bold text-foreground print:text-black text-xs">
                  {trip.regNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Fleet Model
                </span>
                <span className="font-bold text-foreground print:text-black text-xs">
                  {trip.modelName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Assigned Driver
                </span>
                <span className="font-bold text-foreground print:text-black text-xs">
                  {trip.driver.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Cargo Type
                </span>
                <span className="font-bold text-foreground print:text-black text-xs uppercase">
                  {trip.temp === "reefer" ? "Cold Chain (Reefer)" : "Ambient Dry"}
                </span>
              </div>
            </div>

            {/* Waypoint Item Breakdown */}
            <div className="space-y-4">
              <h2 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Loading Sequence & Crate Allocation (LIFO Order)
              </h2>

              {trip.waypoints.map((wp) => (
                <div
                  key={wp.seq}
                  className="rounded-xl border border-border/70 overflow-hidden"
                >
                  <div className="bg-muted/60 print:bg-gray-200 px-3 py-2 flex items-center justify-between font-bold text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-foreground text-background px-1.5 py-0.5 rounded text-[10px]">
                        Drop #{wp.seq}
                      </span>
                      <span>
                        {wp.outletName} ({wp.outletCode})
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground print:text-gray-700">
                      {wp.items.reduce((s, i) => s + i.crateCount, 0)} Crates ·{" "}
                      {wp.items.reduce((s, i) => s + i.weightKg, 0)} kg
                    </span>
                  </div>

                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-muted/20 border-b border-border/50 text-[10px] text-muted-foreground uppercase">
                      <tr>
                        <th className="py-1.5 px-3">Box / Package Code</th>
                        <th className="py-1.5 px-3">Description</th>
                        <th className="py-1.5 px-3">Staging</th>
                        <th className="py-1.5 px-3 text-right">Crates</th>
                        <th className="py-1.5 px-3 text-right">Weight</th>
                        <th className="py-1.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {wp.items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/10">
                          <td className="py-1.5 px-3 font-bold text-foreground print:text-black">
                            {item.packageCode}
                          </td>
                          <td className="py-1.5 px-3 text-muted-foreground print:text-gray-800">
                            {item.itemTitle}
                          </td>
                          <td className="py-1.5 px-3 font-semibold">{item.stagingBay}</td>
                          <td className="py-1.5 px-3 text-right font-bold">
                            {item.crateCount}
                          </td>
                          <td className="py-1.5 px-3 text-right">{item.weightKg} kg</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <CheckCircleIcon className="size-3" weight="fill" />
                              <span>Verified</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Total Summary Matrix */}
            <div className="flex justify-between items-center p-3 bg-muted/30 print:bg-gray-100 rounded-xl border border-border/60 font-bold text-xs">
              <span>Total Fleet Payload</span>
              <div className="flex items-center gap-4">
                <span>{totalCrates} Crates</span>
                <span>{totalWeight.toLocaleString()} kg</span>
                <span>{totalVolume.toFixed(2)} m³</span>
              </div>
            </div>

            {/* Signatures & Seal Verification */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/80 text-[11px]">
              <div className="flex flex-col gap-8">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Loaded & Verified By
                </span>
                <div className="border-b border-foreground/40 print:border-black pt-2 flex justify-between">
                  <span>Dock Loader Signature</span>
                  <span className="text-muted-foreground">{currentDateStr}</span>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Accepted & Received By
                </span>
                <div className="border-b border-foreground/40 print:border-black pt-2 flex justify-between">
                  <span>Driver: {trip.driver.name}</span>
                  <span className="text-muted-foreground">Seal #: {trip.sealNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

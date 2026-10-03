import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { ManifestTableRow } from "./manifest-table-row";
import type { LoaderVehicleTrip } from "../types";

interface ManifestTableViewProps {
  trips: LoaderVehicleTrip[];
  onInspectTrip: (trip: LoaderVehicleTrip) => void;
  onOpenBay: (tripId: string) => void;
}

export function ManifestTableView({
  trips,
  onInspectTrip,
  onOpenBay,
}: ManifestTableViewProps) {
  return (
    <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-xs bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 pl-3.5 pr-2 w-[11%]">
              Bay
            </TableHead>
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[15%]">
              Manifest
            </TableHead>
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[20%]">
              Vehicle & Driver
            </TableHead>
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[16%]">
              Departure
            </TableHead>
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[24%]">
              Progress & Load
            </TableHead>
            <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 text-right w-[14%]">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <ManifestTableRow
              key={trip.id}
              trip={trip}
              onInspectTrip={onInspectTrip}
              onOpenBay={onOpenBay}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

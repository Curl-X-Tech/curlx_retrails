import { TableRow, TableCell } from "@/components/ui/table";

interface DeferralsGroupHeaderProps {
  title: string;
  itemCount: number;
  description?: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  colSpan?: number;
}

export function DeferralsGroupHeader({
  title,
  itemCount,
  description,
  totalWeightKg,
  totalVolumeM3,
  totalValueLkr,
  colSpan = 9,
}: DeferralsGroupHeaderProps) {
  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40 border-y border-border/70 select-none">
      <TableCell colSpan={colSpan} className="py-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xs text-foreground">
              {title}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/50">
              {itemCount} {itemCount === 1 ? "order" : "orders"}
            </span>
            {description && (
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                • {description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <span>{totalWeightKg.toLocaleString()} kg</span>
            <span>•</span>
            <span>{totalVolumeM3} m³</span>
            <span>•</span>
            <span>LKR {totalValueLkr.toLocaleString()}</span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

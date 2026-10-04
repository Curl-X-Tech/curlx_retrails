import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiscrepancyIssue, ReceivingCheckItem } from "../types";

const ISSUE_LABELS: Record<DiscrepancyIssue, string> = {
  damaged_in_transit: "Damaged in transit",
  missing_crate: "Missing package",
  temp_spoilage: "Temperature spoilage",
  rejected_by_store: "Rejected by store",
};

interface StoreReceivingSheetTableProps {
  isLoading: boolean;
  visibleLines: ReceivingCheckItem[];
  canReceive: boolean;
  onSetQty: (line: ReceivingCheckItem, qty: number) => void;
  onPatch: (itemId: string, change: Partial<ReceivingCheckItem>) => void;
}

export function StoreReceivingSheetTable({
  isLoading,
  visibleLines,
  canReceive,
  onSetQty,
  onPatch,
}: StoreReceivingSheetTableProps) {
  return (
    <div className="border border-border/80 rounded-xl overflow-hidden">
      <Table className="w-full text-xs">
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold">Item</TableHead>
            <TableHead className="text-xs font-semibold text-right">Ordered</TableHead>
            <TableHead className="text-xs font-semibold text-center">Received</TableHead>
            <TableHead className="text-xs font-semibold">Reason</TableHead>
            <TableHead className="text-xs font-semibold">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                Loading items
              </TableCell>
            </TableRow>
          ) : visibleLines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No items match the current filter.
              </TableCell>
            </TableRow>
          ) : (
            visibleLines.map((line) => {
              const short = line.receivedQty < line.requestedQty;
              return (
                <TableRow key={line.itemId}>
                  <TableCell>
                    <span className="font-medium text-foreground block">{line.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {line.packageCode}
                      {line.specialHandlingCode ? ` • ${line.specialHandlingCode}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.requestedQty}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        className="size-6 p-0 cursor-pointer"
                        disabled={!canReceive || line.receivedQty === 0}
                        onClick={() => onSetQty(line, line.receivedQty - 1)}
                      >
                        <MinusIcon className="size-3" />
                      </Button>
                      <input
                        type="number"
                        min={0}
                        max={line.requestedQty}
                        disabled={!canReceive}
                        value={line.receivedQty}
                        onChange={(e) => onSetQty(line, Number(e.target.value) || 0)}
                        className={`w-14 h-6 rounded-md border border-border bg-card px-1 text-center text-xs font-bold tabular-nums disabled:opacity-70 ${
                          short ? "text-destructive" : "text-foreground"
                        }`}
                      />
                      <Button
                        variant="outline"
                        size="xs"
                        className="size-6 p-0 cursor-pointer"
                        disabled={!canReceive || line.receivedQty >= line.requestedQty}
                        onClick={() => onSetQty(line, line.receivedQty + 1)}
                      >
                        <PlusIcon className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {short && canReceive ? (
                      <select
                        value={line.issueType}
                        onChange={(e) =>
                          onPatch(line.itemId, {
                            issueType: e.target.value as DiscrepancyIssue,
                          })
                        }
                        aria-label="Discrepancy reason"
                        className="h-7 rounded-md border border-border bg-card px-2 text-xs"
                      >
                        {Object.entries(ISSUE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {short && canReceive ? (
                      <Input
                        placeholder="Optional note"
                        value={line.notes ?? ""}
                        onChange={(e) => onPatch(line.itemId, { notes: e.target.value })}
                        className="h-7 text-xs min-w-40"
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import { WarningCircleIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { LoaderOrderItem, DiscrepancyType } from "../types";

const DISCREPANCY_OPTIONS: { id: DiscrepancyType; label: string }[] = [
  { id: "shortage", label: "Crate Shortage" },
  { id: "damaged", label: "Damaged Crates" },
  { id: "temp_breach", label: "Temp Breach" },
  { id: "wrong_barcode", label: "Barcode Mismatch" },
];

interface BayDiscrepancySheetProps {
  reportingItem: { stopSeq: number; item: LoaderOrderItem } | null;
  onClose: () => void;
  discrepancyType: DiscrepancyType;
  onTypeChange: (type: DiscrepancyType) => void;
  discrepancyNotes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
}

export function BayDiscrepancySheet({
  reportingItem,
  onClose,
  discrepancyType,
  onTypeChange,
  discrepancyNotes,
  onNotesChange,
  onConfirm,
}: BayDiscrepancySheetProps) {
  return (
    <Sheet open={Boolean(reportingItem)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-md w-full p-0 flex flex-col bg-card [&>button]:hidden"
      >
        <SheetHeader className="p-5 pb-3 border-b border-border/70">
          <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <WarningCircleIcon className="size-5 text-amber-500" weight="bold" />
            <span>Report Item Discrepancy</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Log a shortfall, damaged crates, or temperature issue for this order item.
          </SheetDescription>
        </SheetHeader>

        {reportingItem && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
              <span className="font-heading font-bold text-sm text-foreground block">
                {reportingItem.item.itemTitle}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/70">
                  {reportingItem.item.packageCode}
                </span>
                <span>#{reportingItem.item.orderRef}</span>
                <span>·</span>
                <span>{reportingItem.item.crateCount} Crates</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                Issue Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DISCREPANCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onTypeChange(opt.id)}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-semibold border transition-all text-left",
                      discrepancyType === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/80 bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                Discrepancy Notes
              </label>
              <Input
                placeholder="e.g. 2 crates missing from staging bay..."
                value={discrepancyNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="pt-3 flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="flex-1 h-11 rounded-xl text-xs font-semibold"
              >
                Flag Discrepancy
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

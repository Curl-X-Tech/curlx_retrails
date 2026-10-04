import { PrinterIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface OrderFormActionBarProps {
  isSubmitting: boolean;
  hasRows: boolean;
  isUrgent: boolean;
  onToggleUrgent: (urgent: boolean) => void;
  onPrintDraft: () => void;
  onConfirmOrder: () => void;
}

export function OrderFormActionBar({
  isSubmitting,
  hasRows,
  isUrgent,
  onToggleUrgent,
  onPrintDraft,
  onConfirmOrder,
}: OrderFormActionBarProps) {
  return (
    <div className="border-t border-border bg-card px-4 md:px-8 py-3.5 shrink-0 flex items-center justify-between gap-3 shadow-lg">
      <Button
        variant="outline"
        size="default"
        onClick={onPrintDraft}
        disabled={!hasRows}
        className="h-10 px-4 text-xs font-semibold gap-2 rounded-xl border-border hover:bg-muted/50 cursor-pointer shadow-2xs"
      >
        <PrinterIcon className="size-4 text-muted-foreground" />
        <span>Print Draft</span>
      </Button>

      <div className="flex items-center gap-3.5 flex-wrap justify-end">
        <label
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
            isUrgent
              ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 font-semibold"
              : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground"
          }`}
        >
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => onToggleUrgent(e.target.checked)}
            className="size-3.5 rounded border-border text-amber-600 focus:ring-amber-500/20 cursor-pointer"
          />
          <WarningCircleIcon
            className={`size-3.5 ${isUrgent ? "text-amber-600" : "text-muted-foreground"}`}
            weight={isUrgent ? "bold" : "regular"}
          />
          <span>Mark as Urgent / Priority</span>
        </label>

        <span className="text-xs text-muted-foreground hidden lg:inline">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-medium text-[10px]">
            Cmd+Enter
          </kbd>
        </span>

        <Button
          size="default"
          disabled={isSubmitting || !hasRows}
          onClick={onConfirmOrder}
          className="h-10 px-6 text-xs font-bold gap-2 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white shadow-md cursor-pointer transition-all active:scale-95"
        >
          <CheckCircleIcon className="size-4 font-bold" />
          <span>{isSubmitting ? "Submitting..." : "Confirm & Place Order"}</span>
        </Button>
      </div>
    </div>
  );
}

import { PrinterIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface OrderFormActionBarProps {
  isSubmitting: boolean;
  hasRows: boolean;
  onOpenPrintPreview: () => void;
  onConfirmOrder: () => void;
}

export function OrderFormActionBar({
  isSubmitting,
  hasRows,
  onOpenPrintPreview,
  onConfirmOrder,
}: OrderFormActionBarProps) {
  return (
    <div className="border-t border-border bg-card px-4 md:px-8 py-3.5 shrink-0 flex items-center justify-between gap-3 shadow-lg">
      <Button
        variant="outline"
        size="default"
        onClick={onOpenPrintPreview}
        className="h-10 px-4 text-xs font-semibold gap-2 rounded-xl border-border hover:bg-muted/50 cursor-pointer shadow-2xs"
      >
        <PrinterIcon className="size-4 text-muted-foreground" />
        <span>Print Draft</span>
      </Button>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden md:inline">
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

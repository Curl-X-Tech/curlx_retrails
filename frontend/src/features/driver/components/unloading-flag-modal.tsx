import { WarningIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLAG_REASONS = [
  "Damaged crates on arrival",
  "Temperature tolerance exceeded",
  "Crates count / SKU mismatch",
  "Store manager refused intake",
  "Dock access obstructed",
];

interface UnloadingFlagModalProps {
  isOpen: boolean;
  targetLabel: string;
  flagReason: string;
  onSelectReason: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function UnloadingFlagModal({
  isOpen,
  targetLabel,
  flagReason,
  onSelectReason,
  onConfirm,
  onClose,
}: UnloadingFlagModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <WarningIcon className="size-5" weight="fill" />
            <h3 className="font-heading font-black text-sm text-foreground">
              Flag Delivery Discrepancy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <XIcon className="size-4" weight="bold" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Select the exception reason for {targetLabel}:
        </p>

        <div className="space-y-2 text-xs">
          {FLAG_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className={cn(
                "w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                flagReason === reason
                  ? "border-destructive bg-destructive/10 text-destructive font-bold"
                  : "border-border hover:bg-muted text-foreground"
              )}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 rounded-xl h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );
}

import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface OrderCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderRef?: string;
  onConfirm: () => void;
}

export function OrderCancelDialog({
  open,
  onOpenChange,
  orderRef,
  onConfirm,
}: OrderCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <WarningCircleIcon className="size-5 text-destructive" />
            <DialogTitle className="text-base font-bold">
              Confirm Order Cancellation
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Are you sure you want to cancel order{" "}
            <strong className="text-foreground">{orderRef}</strong>? This action will
            remove the order from the dispatch planning queue and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl cursor-pointer"
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="text-xs rounded-xl font-semibold cursor-pointer"
          >
            Confirm Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

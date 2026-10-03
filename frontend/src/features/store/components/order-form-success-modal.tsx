import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { StoreOutletOption } from "../types";

interface OrderFormSuccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderRef: string;
  selectedOutlet: StoreOutletOption;
  selectedDate: string;
  totalWeightKg: number;
  totalOrderValueLkr: number;
  onCreateAnother: () => void;
}

export function OrderFormSuccessModal({
  isOpen,
  onOpenChange,
  orderRef,
  selectedOutlet,
  selectedDate,
  totalWeightKg,
  totalOrderValueLkr,
  onCreateAnother,
}: OrderFormSuccessModalProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="sm:max-w-lg mx-auto rounded-t-2xl p-6 bg-card border-t border-border"
      >
        <SheetHeader className="text-center space-y-2">
          <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircleIcon className="size-7" weight="bold" />
          </div>
          <SheetTitle className="text-xl font-bold text-foreground">
            Order Confirmed & Dispatched!
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Order <span className="font-semibold text-foreground">{orderRef}</span> has been
            transmitted to {selectedOutlet.depot} Distribution Center for route batching.
          </SheetDescription>
        </SheetHeader>

        <div className="my-6 p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Outlet:</span>
            <span className="font-semibold text-foreground">{selectedOutlet.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Date:</span>
            <span className="font-semibold text-foreground">{selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Weight:</span>
            <span className="font-semibold text-foreground">
              {totalWeightKg.toFixed(1)} kg
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Valuation:</span>
            <span className="font-bold text-primary">
              LKR {totalOrderValueLkr.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCreateAnother}
            className="flex-1 rounded-xl text-xs cursor-pointer"
          >
            Create Another
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/store/orders");
            }}
            className="flex-1 rounded-xl text-xs bg-primary text-primary-foreground font-semibold cursor-pointer"
          >
            View in Queue
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

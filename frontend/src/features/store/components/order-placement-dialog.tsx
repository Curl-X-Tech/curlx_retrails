import { CheckIcon, XIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlacementStage } from "../hooks/use-order-builder";

interface OrderPlacementDialogProps {
  stage: PlacementStage;
  nextDate: string;
  onSchedule: () => void;
  onCancel: () => void;
}

type StepState = "done" | "failed" | "active" | "idle";

function StepMarker({ state }: { state: StepState }) {
  const base = "absolute -left-2.5 top-0.5 size-5 rounded-full flex items-center justify-center";
  if (state === "done")
    return (
      <span className={`${base} bg-primary text-primary-foreground`}>
        <CheckIcon className="size-3" weight="bold" />
      </span>
    );
  if (state === "failed")
    return (
      <span className={`${base} bg-red-600 text-white`}>
        <XIcon className="size-3" weight="bold" />
      </span>
    );
  if (state === "active")
    return (
      <span className={`${base} border-2 border-primary bg-background`}>
        <CircleNotchIcon className="size-3 animate-spin text-primary" />
      </span>
    );
  return <span className={`${base} border-2 border-border bg-background`} />;
}

export function OrderPlacementDialog({
  stage,
  nextDate,
  onSchedule,
  onCancel,
}: OrderPlacementDialogProps) {
  const isCutoff = stage === "cutoff";
  const received: StepState = stage === "received" ? "active" : "done";
  const cutoff: StepState = isCutoff
    ? "failed"
    : stage === "received"
      ? "idle"
      : "done";
  const placed: StepState =
    stage === "placed" ? "done" : stage === "placing" ? "active" : "idle";

  return (
    <Dialog open={stage !== null} onOpenChange={(open) => !open && isCutoff && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-6"
      >
        <DialogHeader>
          <DialogTitle>Placing order</DialogTitle>
          <DialogDescription className="sr-only">
            Order placement progress.
          </DialogDescription>
        </DialogHeader>

        <ol className="relative ml-3 border-l border-dashed border-border space-y-6 py-2">
          <li className="pl-6 relative">
            <StepMarker state={received} />
            <p className="text-sm font-medium text-foreground">Order received</p>
            <p className="font-mono text-xs text-muted-foreground">
              Checking order details and the daily cut-off.
            </p>
          </li>
          <li className="pl-6 relative">
            <StepMarker state={cutoff} />
            <p className="text-sm font-medium text-foreground">
              {isCutoff ? "Order cannot be placed after 4:00 PM" : "Cut-off check"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {isCutoff ? "Same-day dispatch has closed." : "Orders close at 4:00 PM."}
            </p>
          </li>
          {isCutoff && (
            <li className="pl-6 relative">
              <StepMarker state="active" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Schedule the order for the next day?
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Delivery date: {nextDate}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSchedule}
                  className="font-mono text-xs font-bold text-primary cursor-pointer"
                >
                  YES
                </Button>
              </div>
            </li>
          )}
          <li className="pl-6 relative">
            <StepMarker state={placed} />
            <p
              className={`text-sm font-medium ${placed === "idle" ? "text-muted-foreground" : "text-foreground"}`}
            >
              Order placed
            </p>
          </li>
        </ol>

        {isCutoff && (
          <Button variant="outline" onClick={onCancel} className="w-full cursor-pointer">
            Cancel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

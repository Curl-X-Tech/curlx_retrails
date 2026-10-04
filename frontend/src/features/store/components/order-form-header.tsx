import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderFormHeaderProps {
  orderRef: string;
  hasRows: boolean;
  onClearDraft: () => void;
}

export function OrderFormHeader({
  orderRef,
  hasRows,
  onClearDraft,
}: OrderFormHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border bg-card px-4 md:px-8 py-3.5 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground tracking-tight">
              Create New Order
            </h1>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary bg-primary/5"
            >
              Draft #{orderRef}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compose store replenishment manifest, assign destination outlet, and dispatch
            for depot allocation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasRows && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearDraft}
              className="text-xs text-muted-foreground hover:text-destructive gap-1 rounded-xl cursor-pointer"
            >
              <ArrowsClockwiseIcon className="size-3.5" />
              Reset Draft
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/store/orders")}
            className="text-xs gap-1.5 rounded-xl border-border hover:bg-muted/40 cursor-pointer shadow-2xs font-semibold"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    </div>
  );
}

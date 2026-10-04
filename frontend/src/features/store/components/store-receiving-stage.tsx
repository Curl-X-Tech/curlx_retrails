import { cn } from "@/lib/utils";
import type { InboundShipment } from "../types";

const STAGES: { key: InboundShipment["status"]; label: string }[] = [
  { key: "loading", label: "Loading" },
  { key: "in_transit", label: "On the way" },
  { key: "served", label: "Received" },
];

export function StoreReceivingStage({ status }: { status: InboundShipment["status"] }) {
  const activeIndex = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, index) => (
        <div key={stage.key} className="flex items-center gap-1">
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums",
              index === activeIndex && "text-foreground",
              index < activeIndex && "text-emerald-600",
              index > activeIndex && "text-muted-foreground/60"
            )}
          >
            {stage.label}
          </span>
          {index < STAGES.length - 1 && (
            <span
              className={cn(
                "h-px w-3",
                index < activeIndex ? "bg-emerald-600" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function getReceivingActionLabel(status: InboundShipment["status"]): string {
  if (status === "in_transit") return "Receive";
  if (status === "served") return "Receipt";
  return "Details";
}

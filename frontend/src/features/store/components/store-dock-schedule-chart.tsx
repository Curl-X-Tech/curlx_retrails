import { Card } from "@/components/ui/card";
import { ClockIcon, SnowflakeIcon, TruckIcon } from "@phosphor-icons/react";
import type { StoreOrderRecord } from "../types";

interface StoreDockScheduleChartProps {
  orders: StoreOrderRecord[];
}

interface DockTimeSlot {
  slot: string;
  timeRange: string;
  orderRefs: string[];
  totalKg: number;
  hasCold: boolean;
  status: "completed" | "active" | "upcoming";
}

export function StoreDockScheduleChart({ orders }: StoreDockScheduleChartProps) {
  const slots: DockTimeSlot[] = [
    {
      slot: "Wave 1 Early Dock",
      timeRange: "04:00 - 06:00 AM",
      orderRefs: orders.slice(0, 1).map((o) => o.orderRef),
      totalKg: 420.5,
      hasCold: true,
      status: "completed",
    },
    {
      slot: "Wave 1 Main Inbound",
      timeRange: "06:00 - 08:00 AM",
      orderRefs: orders.slice(1, 3).map((o) => o.orderRef),
      totalKg: 860.0,
      hasCold: true,
      status: "active",
    },
    {
      slot: "Wave 2 Mid-Morning",
      timeRange: "08:00 - 10:00 AM",
      orderRefs: orders.slice(3, 4).map((o) => o.orderRef),
      totalKg: 310.2,
      hasCold: false,
      status: "upcoming",
    },
    {
      slot: "Wave 2 Afternoon Top-Up",
      timeRange: "10:00 - 12:00 PM",
      orderRefs: orders.slice(4, 5).map((o) => o.orderRef),
      totalKg: 180.0,
      hasCold: false,
      status: "upcoming",
    },
  ];

  return (
    <Card className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
            <ClockIcon className="size-4 text-sky-600" weight="bold" />
            Today's Dock Receiving Schedule
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Vehicle docking intervals and staged bay allocations
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground">Bay 01 Active</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slots.map((s, idx) => {
          const isDone = s.status === "completed";
          const isActive = s.status === "active";

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : isDone
                    ? "bg-muted/30 border-border/70 opacity-80"
                    : "bg-card border-border/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.timeRange}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.status}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <span className="text-xs font-bold text-foreground block">{s.slot}</span>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums font-semibold">
                    <TruckIcon className="size-3 text-primary" weight="bold" />
                    {s.totalKg.toFixed(1)} kg
                  </span>
                  {s.hasCold && (
                    <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                      <SnowflakeIcon className="size-3" weight="bold" />
                      COL
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getColomboParts, isPastCutoff } from "@/lib/business-day";

export function StoreCutoffBanner() {
  const navigate = useNavigate();
  const [now, setNow] = React.useState<Date>(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parts = getColomboParts(now);
  const pastCutoff = isPastCutoff(now);

  const timeRemaining = React.useMemo(() => {
    if (pastCutoff) {
      // Time until next day 16:00
      const currentSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
      const targetSeconds = (24 + 16) * 3600;
      const diff = targetSeconds - currentSeconds;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      // Time until 16:00 today
      const currentSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
      const targetSeconds = 16 * 3600;
      const diff = Math.max(0, targetSeconds - currentSeconds);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
  }, [parts, pastCutoff]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-xs transition-all ${
        pastCutoff ? "bg-muted/40 border-border/80" : "bg-card border-primary/30"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`size-2 rounded-full ${
                pastCutoff ? "bg-muted-foreground" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span className="font-heading font-bold text-sm text-foreground">
              {pastCutoff
                ? "16:00 Colombo Cutoff Reached"
                : "Daily Replenishment Window Active"}
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              [Asia/Colombo: {parts.timeStr}]
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pastCutoff
              ? "Orders placed now will be scheduled for Day+2 delivery wave (05:00 AM dispatch)."
              : "Orders submitted before 16:00 SLST guarantee inclusion in tomorrow morning's Wave 1 dispatch."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              {pastCutoff ? "Next Cutoff In" : "Cutoff Closes In"}
            </span>
            <span className="font-mono text-lg font-black text-foreground tabular-nums">
              {timeRemaining}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/store/orders/new")}
            className="text-xs font-semibold h-8"
          >
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
}

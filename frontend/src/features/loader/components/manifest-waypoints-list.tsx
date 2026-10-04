import { getHandlingLabel } from "../utils";
import type { LoaderWaypoint } from "../types";

interface ManifestWaypointsListProps {
  waypoints: LoaderWaypoint[];
}

export function ManifestWaypointsList({ waypoints }: ManifestWaypointsListProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
        Loading Sequence ({waypoints.length} Drops)
      </h4>
      <div className="space-y-2">
        {waypoints.map((wp) => (
          <div
            key={wp.seq}
            className="p-2.5 rounded-xl border border-border/80 bg-background space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 px-1.5 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-black text-[10px]">
                  Drop #{wp.seq}
                </span>
                <span className="font-heading font-bold text-xs text-foreground">
                  {wp.outletName}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  ({wp.outletCode})
                </span>
              </div>
              <span className="text-[11px] font-bold text-foreground">
                {wp.items.reduce((s, i) => s + i.crateCount, 0)} Crates
              </span>
            </div>

            {wp.items && wp.items.length > 0 ? (
              <div className="space-y-1 pt-0.5">
                {wp.items.map((item) => {
                  const handlingText = getHandlingLabel(item.specialHandlingCode);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-black text-foreground text-xs">
                            {item.packageCode}
                          </span>
                          <span>·</span>
                          <span className="text-[10px] font-bold text-foreground/80">
                            {item.stagingBay}
                          </span>
                          {handlingText && (
                            <>
                              <span>·</span>
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                {handlingText}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {item.itemTitle}
                        </span>
                      </div>
                      <span className="font-heading font-black text-foreground text-xs shrink-0">
                        {item.crateCount} Crates
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic pl-2">
                No items allocated.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

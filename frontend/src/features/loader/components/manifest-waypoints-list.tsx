import { getHandlingLabel } from "../utils";
import type { LoaderWaypoint } from "../types";

interface ManifestWaypointsListProps {
  waypoints: LoaderWaypoint[];
}

export function ManifestWaypointsList({ waypoints }: ManifestWaypointsListProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
        Waypoints ({waypoints.length} Stops)
      </h4>
      <div className="space-y-2">
        {waypoints.map((wp) => (
          <div
            key={wp.seq}
            className="p-2.5 rounded-xl border border-border/80 bg-background space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-black text-[11px]">
                  {wp.seq}
                </span>
                <span className="font-heading font-bold text-xs text-foreground">
                  {wp.outletName}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {wp.deliveryWindow}
              </span>
            </div>

            {wp.items && wp.items.length > 0 ? (
              <div className="space-y-1 pt-0.5">
                {wp.items.map((item) => {
                  const handlingText = getHandlingLabel(item.specialHandlingCode);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-muted/40 text-xs gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate text-[11px]">
                          {item.itemTitle}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {item.packageCode}
                          </span>
                          <span>·</span>
                          <span>{item.stagingBay}</span>
                          {handlingText && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                {handlingText}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-foreground text-[11px] shrink-0">
                        {item.crateCount} Crates
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic pl-7">
                Loading completed for this stop.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

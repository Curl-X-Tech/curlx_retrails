import { CloudRainIcon, TrendUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface CalendarFilterControlsProps {
  monsoonFilter: string;
  onMonsoonChange: (filter: string) => void;
  surgeFilter: string;
  onSurgeChange: (filter: string) => void;
  daysCount: number;
  onDaysCountChange: (days: number) => void;
}

export function CalendarFilterControls({
  monsoonFilter,
  onMonsoonChange,
  surgeFilter,
  onSurgeChange,
  daysCount,
  onDaysCountChange,
}: CalendarFilterControlsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/40 text-xs">
        {([14, 30, 60] as const).map((days) => (
          <button
            key={days}
            onClick={() => onDaysCountChange(days)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
              daysCount === days
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {days} Days
          </button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <CloudRainIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Weather:{" "}
            {monsoonFilter === "all"
              ? "All Conditions"
              : monsoonFilter === "monsoon"
                ? "Monsoon Only"
                : "Clear Sky"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Weather Advisory</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={monsoonFilter} onValueChange={onMonsoonChange}>
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Conditions
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="monsoon" className="text-xs">
              Monsoon Advisory
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="clear" className="text-xs">
              Clear Weather
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <TrendUpIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Surge:{" "}
            {surgeFilter === "all"
              ? "All Days"
              : surgeFilter === "surging"
                ? "Peak Surge Days"
                : "Standard Days"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Demand Multiplier</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={surgeFilter} onValueChange={onSurgeChange}>
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Days
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="surging" className="text-xs">
              Surge Days (&gt;1.0x)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="standard" className="text-xs">
              Standard Days (1.0x)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

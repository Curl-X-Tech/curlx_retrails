import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ManifestStatusFilter } from "../types";

interface ManifestStatusTabsProps {
  statusFilter: ManifestStatusFilter;
  onStatusFilterChange: (status: ManifestStatusFilter) => void;
  counts: {
    total: number;
    loading: number;
    ready: number;
    dispatched: number;
    flagged: number;
  };
}

export function ManifestStatusTabs({
  statusFilter,
  onStatusFilterChange,
  counts,
}: ManifestStatusTabsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <Tabs
        value={statusFilter}
        onValueChange={(val) => onStatusFilterChange(val as ManifestStatusFilter)}
        className="w-full sm:w-auto"
      >
        <TabsList className="bg-muted/70 p-0.5 rounded-xl h-9 w-full sm:w-auto grid grid-cols-5 sm:flex sm:items-center gap-0.5">
          <TabsTrigger
            value="loading"
            className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span>Dock Queue</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
              {counts.loading}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="ready"
            className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <span>Ready</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
              {counts.ready}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="dispatched"
            className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <span>History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
              {counts.dispatched}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="flagged"
            className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <span>Flagged</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
              {counts.flagged}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all"
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-muted text-foreground">
              {counts.total}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

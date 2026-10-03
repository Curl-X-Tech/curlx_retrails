import { PackageIcon, SnowflakeIcon, ScalesIcon } from "@phosphor-icons/react";
import type { MasterItem } from "../types";

export interface ItemKpiStripProps {
  items?: MasterItem[];
  categoriesCount: number;
}

export function ItemKpiStrip({ items = [], categoriesCount }: ItemKpiStripProps) {
  const coldChainCount = items.filter((i) => i.requires_cold_chain).length;

  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <PackageIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Total SKUs:</span>
        <span className="font-bold text-foreground text-[11px]">{items.length}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <SnowflakeIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Cold Chain SKUs:</span>
        <span className="font-bold text-foreground text-[11px]">{coldChainCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Categories:</span>
        <span className="font-bold text-foreground text-[11px]">{categoriesCount}</span>
      </div>
    </div>
  );
}

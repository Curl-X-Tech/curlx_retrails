import { FileTextIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react";

interface DeferralsAuditKpiBarProps {
  totalRecords: number;
}

export function DeferralsAuditKpiBar({ totalRecords }: DeferralsAuditKpiBarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none shrink-0">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <FileTextIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Audit Records:</span>
        <span className="font-bold text-foreground text-[11px]">{totalRecords}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ShieldCheckIcon className="size-3.5 text-emerald-600 shrink-0" weight="bold" />
        <span className="text-muted-foreground text-[11px]">
          Consecutive Skips Prevented:
        </span>
        <span className="font-bold text-emerald-600 text-[11px]">4 / 4</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <span className="text-muted-foreground text-[11px]">Limiting Resources:</span>
        <span className="font-bold text-foreground text-[11px]">4 Categories</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-[11px]">Decision Makers:</span>
        <span className="font-bold text-foreground text-[11px]">2 Dispatchers</span>
      </div>
    </div>
  );
}

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";

interface DeferralsWave1CardProps {
  title: string;
  count: number;
  needed: number;
  totalKg: number;
  value: number;
  imageSrc: string;
  ringColor: string;
  badgeDotColor: string;
  tooltipTitle: string;
  tooltipDesc: string;
}

export function DeferralsWave1Card({
  title,
  count,
  needed,
  totalKg,
  value,
  imageSrc,
  ringColor,
  badgeDotColor,
  tooltipTitle,
  tooltipDesc,
}: DeferralsWave1CardProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="px-4 py-3.5 min-h-[82px] bg-card border border-border/70 hover:border-border transition-all shadow-xs rounded-xl flex items-center justify-between gap-3.5 cursor-default" />
        }
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="shrink-0">
            <CircularProgressRing
              value={value}
              size={44}
              strokeWidth={4}
              colorClassName={ringColor}
            >
              <span className={`text-xs font-heading font-black ${ringColor}`}>
                {count}
              </span>
            </CircularProgressRing>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-bold text-foreground truncate">
                {title}
              </span>
              <span className={`size-1.5 rounded-full ${badgeDotColor} shrink-0`} />
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {count} / {needed} Needed • {totalKg} kg
            </p>
          </div>
        </div>
        <img
          src={imageSrc}
          alt={title}
          className="w-16 h-12 object-contain shrink-0 opacity-90 drop-shadow-xs select-none pointer-events-none"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs max-w-xs">
        <div className="font-semibold text-foreground">{tooltipTitle}</div>
        <div className="text-muted-foreground text-[11px] mt-0.5">{tooltipDesc}</div>
      </TooltipContent>
    </Tooltip>
  );
}

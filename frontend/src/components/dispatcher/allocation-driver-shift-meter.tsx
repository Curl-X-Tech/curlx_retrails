import { StarIcon, CheckCircleIcon } from "@phosphor-icons/react";

interface AllocationDriverShiftMeterProps {
  rating: number;
  deliveries: number;
  shiftWorkedHours: number | undefined;
  maxShiftHours: number | undefined;
}

function calculateShiftProgress(
  workedHoursVal?: number,
  maxHoursVal: number = 8.0
): { workedHours: string; totalHours: string; percentage: number } {
  const worked = workedHoursVal ?? 3.8;
  const total = maxHoursVal || 8.0;
  const percentage = Math.min(Math.max(Math.round((worked / total) * 100), 0), 100);
  return { workedHours: `${worked.toFixed(1)}h`, totalHours: `${total}h`, percentage };
}

export function AllocationDriverShiftMeter({
  rating,
  deliveries,
  shiftWorkedHours,
  maxShiftHours,
}: AllocationDriverShiftMeterProps) {
  const shift = calculateShiftProgress(shiftWorkedHours, maxShiftHours);
  const radius = 28;
  const arcLength = Math.PI * radius;
  const strokeOffset = arcLength * (1 - shift.percentage / 100);

  return (
    <div className="flex-1 grid grid-cols-2 gap-3 py-2 items-center">
      <div className="flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 bg-muted/40 px-2.5 py-1.5 rounded-xl border border-border/40">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`size-3.5 ${
                  star <= Math.round(rating)
                    ? "text-amber-500 fill-amber-500"
                    : "text-muted-foreground/30"
                }`}
                weight="fill"
              />
            ))}
          </div>
          <span className="font-heading font-black text-xs text-foreground">
            {rating.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-muted/40 px-2.5 py-1.5 rounded-xl border border-border/40">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
            <CheckCircleIcon className="size-3.5 text-emerald-600" weight="fill" />
            <span>Deliveries</span>
          </div>
          <span className="font-heading font-black text-xs text-foreground">
            {deliveries.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-muted/30 p-2 rounded-xl border border-border/40 relative">
        <div className="relative w-[76px] h-[40px] flex items-center justify-center overflow-hidden">
          <svg className="w-[76px] h-[76px] absolute -top-[4px]" viewBox="0 0 76 76">
            <circle
              cx="38"
              cy="38"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth="6"
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(180 38 38)"
            />
            <circle
              cx="38"
              cy="38"
              r={radius}
              fill="none"
              stroke="#0070BA"
              strokeWidth="6"
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(180 38 38)"
            />
          </svg>

          <div className="absolute bottom-0 text-center flex flex-col items-center leading-none">
            <span className="font-heading font-black text-xs text-foreground">
              {shift.workedHours}
            </span>
            <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
              of {shift.totalHours}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-muted-foreground mt-1 tracking-tight uppercase">
          Duty Shift ({shift.percentage}%)
        </span>
      </div>
    </div>
  );
}

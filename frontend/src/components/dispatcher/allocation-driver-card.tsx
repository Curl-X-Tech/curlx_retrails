import * as React from "react";
import {
  UserIcon,
  PhoneCallIcon,
  StarIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  IdentificationCardIcon,
  CalendarIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import type { AllocationDriverDetails } from "@/data/mock-allocation-details";

interface AllocationDriverCardProps {
  driver: AllocationDriverDetails;
  className?: string;
}

function parseShiftProgress(hoursOnDuty?: string): {
  workedHours: string;
  totalHours: string;
  percentage: number;
} {
  if (!hoursOnDuty) {
    return { workedHours: "3.8h", totalHours: "8h", percentage: 48 };
  }
  const parts = hoursOnDuty.split("/");
  if (parts.length === 2) {
    const workedStr = parts[0].trim();
    const totalStr = parts[1].trim();
    const matchWorked = workedStr.match(/(\d+)(?:h)?\s*(\d+)?/);
    const matchTotal = totalStr.match(/(\d+)/);
    const h = matchWorked ? parseInt(matchWorked[1], 10) : 3;
    const m = matchWorked && matchWorked[2] ? parseInt(matchWorked[2], 10) : 45;
    const total = matchTotal ? parseInt(matchTotal[1], 10) : 8;
    const workedDec = h + m / 60;
    const pct = Math.min(Math.round((workedDec / total) * 100), 100);
    return {
      workedHours: `${workedDec.toFixed(1)}h`,
      totalHours: `${total}h`,
      percentage: pct,
    };
  }
  return { workedHours: hoursOnDuty, totalHours: "8h", percentage: 48 };
}

export function AllocationDriverCard({ driver, className }: AllocationDriverCardProps) {
  const [showPhone, setShowPhone] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const rawPhone = driver.phone || "+94 77 123 4567";
  const maskedPhone = rawPhone.replace(/\d(?=\d{2})/g, "•");

  const rating = driver.rating || 4.9;
  const deliveries = driver.deliveriesCompleted || 1420;
  const shift = parseShiftProgress(driver.hoursOnDuty);
  const bloodGroup = driver.bloodGroup || "O+";
  const licenseExpiry = driver.licenseExpiryDate || "2028-11-15";

  const handleCopyPhone = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const radius = 28;
  const arcLength = Math.PI * radius;
  const strokeOffset = arcLength * (1 - shift.percentage / 100);

  return (
    <Card
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between min-w-0 ${
        className || ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pb-2 border-b border-border/50">
        <div className="relative shrink-0">
          <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
            {driver.avatarText ? (
              <span>{driver.avatarText}</span>
            ) : (
              <UserIcon className="size-5" weight="bold" />
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>

        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
              {driver.name}
            </h4>
            <span className="font-mono font-black text-sm sm:text-base text-rose-600 dark:text-rose-400 select-none shrink-0 tracking-tight">
              {bloodGroup}
            </span>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
            {driver.role}
          </p>
        </div>
      </div>

      <div className="space-y-1 py-2 border-b border-border/50 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <IdentificationCardIcon className="size-3.5 text-primary shrink-0" />
            <span>Driving License</span>
          </div>
          <span className="font-mono font-bold text-foreground text-[11px]">
            {driver.licenseId}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <CalendarIcon className="size-3.5 text-primary shrink-0" />
            <span>License Expiry</span>
          </div>
          <span className="font-mono font-bold text-foreground text-[11px]">
            {licenseExpiry}
          </span>
        </div>
      </div>

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

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5 bg-muted/80 px-2 py-1 rounded-xl border border-border/60 min-w-0 flex-1 justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <PhoneIcon className="size-3.5 text-primary shrink-0" weight="bold" />
            <span className="font-mono text-[11px] text-foreground font-semibold select-none truncate">
              {showPhone ? rawPhone : maskedPhone}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <IconButton
              variant="ghost"
              size="xs"
              onClick={() => setShowPhone(!showPhone)}
              className="size-5.5 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-md cursor-pointer"
              title={showPhone ? "Hide phone number" : "Show phone number"}
            >
              {showPhone ? (
                <EyeSlashIcon className="size-3.5" weight="bold" />
              ) : (
                <EyeIcon className="size-3.5" weight="bold" />
              )}
            </IconButton>

            <IconButton
              variant="ghost"
              size="xs"
              onClick={handleCopyPhone}
              className={`size-5.5 rounded-md cursor-pointer transition-colors ${
                copied
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              }`}
              title={copied ? "Copied to clipboard!" : "Copy phone number"}
            >
              {copied ? (
                <CheckIcon className="size-3.5 text-emerald-600" weight="bold" />
              ) : (
                <CopyIcon className="size-3.5" weight="bold" />
              )}
            </IconButton>
          </div>
        </div>

        <a
          href={`tel:${rawPhone}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          title={`Call ${driver.name}`}
        >
          <PhoneCallIcon className="size-3.5" weight="fill" />
          <span>Call</span>
        </a>
      </div>
    </Card>
  );
}

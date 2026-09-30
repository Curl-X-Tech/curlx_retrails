import { Card } from "@/components/ui/card";
import { UserIcon } from "@phosphor-icons/react";
import type { AllocationDriverDetails } from "@/data/mock-allocation-details";

interface AllocationDriverCardProps {
  driver: AllocationDriverDetails;
  className?: string;
}

export function AllocationDriverCard({ driver, className }: AllocationDriverCardProps) {
  return (
    <Card
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex items-center gap-4 min-w-0 ${className || ""}`}
    >
      <div className="size-12 rounded-full bg-[#0070BA] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
        {driver.avatarText ? (
          <span>{driver.avatarText}</span>
        ) : (
          <UserIcon className="size-6" weight="bold" />
        )}
      </div>
      <div className="flex flex-col min-w-0 leading-tight">
        <h4 className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
          {driver.name}
        </h4>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
          {driver.role}
        </p>
        <p className="text-[11px] font-mono text-muted-foreground/80 mt-1 truncate">
          {driver.licenseId}
        </p>
      </div>
    </Card>
  );
}

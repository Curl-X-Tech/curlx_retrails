import { UserIcon, IdentificationCardIcon, CalendarIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { AllocationDriverDetails } from "@/data/mock-allocation-details";
import { AllocationDriverShiftMeter } from "./allocation-driver-shift-meter";
import { AllocationDriverContactBar } from "./allocation-driver-contact-bar";

interface AllocationDriverCardProps {
  driver: AllocationDriverDetails;
  className?: string;
}

export function AllocationDriverCard({ driver, className }: AllocationDriverCardProps) {
  const bloodGroup = driver.bloodGroup || "O+";
  const licenseExpiry = driver.licenseExpiryDate || "2028-11-15";

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
            <span className="font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400 select-none shrink-0 tracking-tight">
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
          <span className="font-bold text-foreground text-[11px]">
            {driver.licenseId}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <CalendarIcon className="size-3.5 text-primary shrink-0" />
            <span>License Expiry</span>
          </div>
          <span className="font-bold text-foreground text-[11px]">{licenseExpiry}</span>
        </div>
      </div>

      <AllocationDriverShiftMeter
        rating={driver.rating || 4.9}
        deliveries={driver.deliveriesCompleted || 1420}
        shiftWorkedHours={driver.shiftHoursWorked}
        maxShiftHours={driver.maxShiftHours}
      />

      <AllocationDriverContactBar driverName={driver.name} phone={driver.phone} />
    </Card>
  );
}

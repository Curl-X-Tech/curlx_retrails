import { CoffeeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface DriverBreakDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBreak: () => void;
}

export function DriverBreakDialog({
  isOpen,
  onOpenChange,
  onSelectBreak,
}: DriverBreakDialogProps) {
  const handleStartBreak = () => {
    onSelectBreak();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl p-4 bg-card">
        <SheetHeader className="pb-3 text-left">
          <SheetTitle className="font-heading font-black text-base text-foreground flex items-center gap-2">
            <CoffeeIcon className="size-5 text-primary" weight="bold" />
            <span>Log Driver Rest Break</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Vehicle telemetry status will pause active stop countdowns.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Button
              variant="outline"
              onClick={handleStartBreak}
              className="h-10 rounded-xl font-bold flex flex-col justify-center cursor-pointer"
            >
              <span>15 Mins</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Quick Rest
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleStartBreak}
              className="h-10 rounded-xl font-bold flex flex-col justify-center cursor-pointer"
            >
              <span>30 Mins</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Meal Break
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleStartBreak}
              className="h-10 rounded-xl font-bold flex flex-col justify-center cursor-pointer"
            >
              <span>45 Mins</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Mandatory
              </span>
            </Button>
          </div>

          <Button
            variant="default"
            onClick={handleStartBreak}
            className="w-full h-10 rounded-xl font-bold text-xs cursor-pointer"
          >
            Start Active Break Timer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

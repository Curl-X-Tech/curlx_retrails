import * as React from "react";
import { Outlet } from "react-router-dom";
import { useSyncState } from "@/hooks/use-offline-trip";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import { DriverHeader } from "./driver-header";
import { DriverBottomNav } from "./driver-bottom-nav";
import { DriverDrawer } from "./driver-drawer";
import { DriverBreakDialog } from "./driver-break-dialog";

export function DriverLayout() {
  const { isOnline, state: syncState, pendingCount } = useSyncState();
  const [isOnBreak, setIsOnBreak] = React.useState(mockDriverTrip.onBreak);
  const [breakTimerSeconds, setBreakTimerSeconds] = React.useState(0);
  const [isBreakModalOpen, setIsBreakModalOpen] = React.useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setBreakTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak]);

  return (
    <div className="h-dvh max-h-dvh w-screen overflow-hidden bg-muted/40 flex justify-center font-sans select-none">
      <div className="w-full max-w-md h-full bg-background flex flex-col shadow-2xl relative border-x border-border/60 overflow-hidden">
        <DriverHeader
          onOpenDrawer={() => setIsMenuDrawerOpen(true)}
          isOnBreak={isOnBreak}
          onToggleBreak={() => setIsOnBreak(false)}
          onOpenBreakModal={() => setIsBreakModalOpen(true)}
          breakTimerSeconds={breakTimerSeconds}
          isOnline={isOnline}
          syncState={syncState}
          pendingCount={pendingCount}
        />

        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <Outlet />
        </main>

        <DriverBottomNav syncState={syncState} />

        <DriverDrawer
          isOpen={isMenuDrawerOpen}
          onOpenChange={setIsMenuDrawerOpen}
        />

        <DriverBreakDialog
          isOpen={isBreakModalOpen}
          onOpenChange={setIsBreakModalOpen}
          onSelectBreak={() => setIsOnBreak(true)}
        />
      </div>
    </div>
  );
}

export default DriverLayout;

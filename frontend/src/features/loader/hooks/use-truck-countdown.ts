import * as React from "react";

export function useTruckCountdown(initialMinutes: number, tripId: string) {
  const [secondsLeft, setSecondsLeft] = React.useState<number>(initialMinutes * 60);

  React.useEffect(() => {
    setSecondsLeft((initialMinutes || 38) * 60);
  }, [initialMinutes, tripId]);

  React.useEffect(() => {
    const timer = setInterval(
      () => setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const totalMinutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isCritical = totalMinutes < 10;
  const isWarning = totalMinutes >= 10 && totalMinutes <= 30;
  const timeString = `${totalMinutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;

  return {
    timeString,
    isCritical,
    isWarning,
  };
}

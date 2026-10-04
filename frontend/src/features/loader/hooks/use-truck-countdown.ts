import * as React from "react";

export function useTruckCountdown(
  dispatchDate?: string,
  plannedDepartureTime?: string,
  tripId?: string
) {
  const calculateCountdown = React.useCallback(() => {
    const now = new Date();
    let target: Date | null = null;

    if (plannedDepartureTime) {
      // Extract hours and minutes
      const match12 = plannedDepartureTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const ampm = match12[3]?.toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;

        if (dispatchDate) {
          const dateOnly = dispatchDate.split("T")[0];
          target = new Date(
            `${dateOnly}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`
          );
        } else {
          target = new Date(now);
          target.setHours(h, m, 0, 0);
        }
      }
    }

    if (!target || isNaN(target.getTime())) {
      return { secondsLeft: 30 * 60, isOverdue: false };
    }

    const diffSec = Math.floor((target.getTime() - now.getTime()) / 1000);
    const isOverdue = diffSec < 0;

    return {
      secondsLeft: Math.abs(diffSec),
      isOverdue,
    };
  }, [dispatchDate, plannedDepartureTime]);

  const [state, setState] = React.useState(calculateCountdown);

  React.useEffect(() => {
    setState(calculateCountdown());
  }, [calculateCountdown, dispatchDate, plannedDepartureTime, tripId]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setState(calculateCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateCountdown]);

  const { secondsLeft, isOverdue } = state;

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const isCritical = isOverdue || (hours === 0 && minutes < 10);
  const isWarning = !isOverdue && hours === 0 && minutes >= 10 && minutes <= 30;

  let timeString = "";
  if (isOverdue) {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      timeString = `${days}d ${hours % 24}h overdue`;
    } else if (hours > 0) {
      timeString = `${hours}h ${minutes}m overdue`;
    } else {
      timeString = `${minutes}m ${seconds.toString().padStart(2, "0")}s overdue`;
    }
  } else {
    if (hours > 0) {
      timeString = `${hours}h ${minutes}m left`;
    } else {
      timeString = `${minutes}m ${seconds.toString().padStart(2, "0")}s left`;
    }
  }

  return {
    timeString,
    isCritical,
    isWarning,
    isOverdue,
  };
}

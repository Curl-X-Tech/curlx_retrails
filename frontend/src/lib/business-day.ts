const TIMEZONE = "Asia/Colombo";
const CUTOFF_HOUR = 16;
const CUTOFF_MINUTE = 0;

export interface ColomboDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateStr: string;
  timeStr: string;
}

export function getColomboParts(date: Date = new Date()): ColomboDateTime {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const year = parseInt(find("year"), 10);
  const month = parseInt(find("month"), 10);
  const day = parseInt(find("day"), 10);
  const hour = parseInt(find("hour"), 10);
  const minute = parseInt(find("minute"), 10);
  const second = parseInt(find("second"), 10);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  return { year, month, day, hour, minute, second, dateStr, timeStr };
}

export function isPastCutoff(date: Date = new Date()): boolean {
  const parts = getColomboParts(date);
  if (parts.hour > CUTOFF_HOUR) return true;
  if (parts.hour === CUTOFF_HOUR && parts.minute >= CUTOFF_MINUTE) return true;
  return false;
}

export function getTodayColomboDate(date: Date = new Date()): string {
  return getColomboParts(date).dateStr;
}

export function getTargetOrderDate(date: Date = new Date()): string {
  const parts = getColomboParts(date);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const offsetDays = isPastCutoff(date) ? 2 : 1;
  base.setUTCDate(base.getUTCDate() + offsetDays);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

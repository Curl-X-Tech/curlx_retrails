import { CalendarBlankIcon, RowsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export type CalendarViewMode = "calendar" | "table";

interface CalendarViewToggleProps {
  view: CalendarViewMode;
  onChange: (view: CalendarViewMode) => void;
}

export function CalendarViewToggle({ view, onChange }: CalendarViewToggleProps) {
  const options: { mode: CalendarViewMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: "calendar",
      label: "Calendar",
      icon: <CalendarBlankIcon className="size-3" />,
    },
    { mode: "table", label: "Table", icon: <RowsIcon className="size-3" /> },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
      {options.map(({ mode, label, icon }) => (
        <Button
          key={mode}
          variant={view === mode ? "default" : "ghost"}
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-md"
          onClick={() => onChange(mode)}
          aria-pressed={view === mode}
        >
          {icon}
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}

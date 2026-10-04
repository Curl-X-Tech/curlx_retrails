import * as React from "react";
import { FormDialog } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { useBulkGenerateCalendar, useCreateCalendarDay } from "@/api/master";

type Mode = "range" | "file";

interface ImportRow {
  date: string;
  festival?: string | null;
  festival_ramp?: number;
  is_holiday?: boolean;
  monsoon?: boolean;
  is_payday?: boolean;
  is_operating?: boolean;
}

export function CalendarImportDialog({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = React.useState<Mode>("range");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const bulk = useBulkGenerateCalendar();
  const create = useCreateCalendarDay();

  const importFile = async (source: File) => {
    const rows: ImportRow[] = JSON.parse(await source.text());
    if (!Array.isArray(rows))
      throw new Error("File must contain a JSON array of calendar days");
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      try {
        await create.mutateAsync({
          date: row.date,
          festival: row.festival ?? null,
          festival_ramp: row.festival_ramp ?? 0,
          is_holiday: row.is_holiday ?? false,
          monsoon: row.monsoon ?? false,
          is_payday: row.is_payday,
          is_operating: row.is_operating,
        });
        created += 1;
      } catch {
        skipped += 1;
      }
    }
    return `Imported ${created} days, skipped ${skipped} existing or invalid rows.`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      if (mode === "range") {
        const created = await bulk.mutateAsync({ from_date: fromDate, to_date: toDate });
        setMessage(`Generated ${created.length} new days.`);
      } else if (file) {
        setMessage(await importFile(file));
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
        mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <FormDialog
      isOpen
      title="Import calendar"
      description="Generate default days for a date range (up to 366 days), or import days from a JSON file. Existing dates are kept."
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Import"
    >
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
        {tab("range", "Date range")}
        {tab("file", "JSON file")}
      </div>
      {mode === "range" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            From
            <Input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            To
            <Input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <Input
          type="file"
          accept="application/json,.json"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      )}
      {message && <p className="text-xs text-foreground">{message}</p>}
    </FormDialog>
  );
}

import * as React from "react";
import { FormDialog } from "@/components/shared";
import { Input } from "@/components/ui/input";

export type FieldValue = string | boolean;
export type FormValues = Record<string, FieldValue>;

export interface FieldSpec {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "time" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  step?: string;
  min?: string;
  max?: string;
}

interface EntityFormDialogProps {
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial: FormValues;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<unknown>;
}

export function buildPayload<T>(fields: FieldSpec[], values: FormValues): T {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.disabled) continue;
    const value = values[field.name];
    if (field.type === "checkbox") payload[field.name] = Boolean(value);
    else if (field.type === "number")
      payload[field.name] = value === "" ? null : Number(value);
    else payload[field.name] = value === "" && !field.required ? null : value;
  }
  return payload as T;
}

export function EntityFormDialog({
  title,
  description,
  fields,
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: EntityFormDialogProps) {
  const [values, setValues] = React.useState<FormValues>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      isOpen
      title={title}
      description={description}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => {
          const id = `field-${field.name}`;
          const set = (v: FieldValue) =>
            setValues((prev) => ({ ...prev, [field.name]: v }));
          if (field.type === "checkbox") {
            return (
              <label
                key={field.name}
                htmlFor={id}
                className="flex items-center gap-2 text-xs font-medium"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(e) => set(e.target.checked)}
                  className="size-4 cursor-pointer"
                />
                {field.label}
              </label>
            );
          }
          return (
            <div key={field.name} className="space-y-1">
              <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  id={id}
                  value={String(values[field.name] ?? "")}
                  required={field.required}
                  disabled={field.disabled}
                  onChange={(e) => set(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs"
                >
                  {!field.required && <option value="">None</option>}
                  {field.required && <option value="">Select...</option>}
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={id}
                  type={field.type}
                  value={String(values[field.name] ?? "")}
                  required={field.required}
                  disabled={field.disabled}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  onChange={(e) => set(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </FormDialog>
  );
}

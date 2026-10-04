import * as React from "react";
import { ConfirmDialog } from "@/components/shared";

interface DeleteEntityDialogProps {
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
}

export function DeleteEntityDialog({
  label,
  onClose,
  onConfirm,
}: DeleteEntityDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen
      variant="destructive"
      title="Delete record"
      description={
        <>
          Delete {label}? This cannot be undone.
          {error && <span className="block mt-2 text-destructive">{error}</span>}
        </>
      }
      confirmLabel="Delete"
      isSubmitting={isSubmitting}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}

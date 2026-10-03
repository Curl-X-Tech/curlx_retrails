import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormDialog({
  title,
  description,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  children,
  className,
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {children}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

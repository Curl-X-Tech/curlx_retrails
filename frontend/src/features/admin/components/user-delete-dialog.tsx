import { ConfirmDialog } from "@/components/shared";
import type { MockUserWithMeta } from "@/data/mock-users";

export interface UserDeleteDialogProps {
  user: MockUserWithMeta | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export function UserDeleteDialog({
  user,
  onClose,
  onConfirm,
  isSubmitting = false,
}: UserDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={!!user}
      title="Confirm User Deletion"
      description={`Are you sure you want to delete ${user?.name || "this user"} (${user?.email || ""})? This action cannot be undone.`}
      confirmLabel={isSubmitting ? "Deleting..." : "Delete Account"}
      variant="destructive"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}

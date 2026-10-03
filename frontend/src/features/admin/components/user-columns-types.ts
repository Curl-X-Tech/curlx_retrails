import type { MockUserWithMeta } from "@/features/admin/types";

export interface UserColumnActions {
  onEdit: (user: MockUserWithMeta) => void;
  onToggleActive: (user: MockUserWithMeta) => void;
  onDelete: (user: MockUserWithMeta) => void;
}

import type { MockUserWithMeta } from "@/data/mock-users";

export interface UserColumnActions {
  onEdit: (user: MockUserWithMeta) => void;
  onToggleActive: (user: MockUserWithMeta) => void;
  onDelete: (user: MockUserWithMeta) => void;
}

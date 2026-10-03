import {
  UserCreateDialog,
  UserEditDialog,
  UserDeleteDialog,
} from "./index";
import type { MockUserWithMeta } from "@/data/mock-users";
import type {
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from "../hooks";

export interface UserDialogsProps {
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  editingUser: MockUserWithMeta | null;
  onCloseEdit: () => void;
  deletingUser: MockUserWithMeta | null;
  onCloseDelete: () => void;
  createMutation: ReturnType<typeof useCreateAdminUser>;
  updateMutation: ReturnType<typeof useUpdateAdminUser>;
  deleteMutation: ReturnType<typeof useDeleteAdminUser>;
}

export function UserDialogs({
  isCreateOpen,
  onCloseCreate,
  editingUser,
  onCloseEdit,
  deletingUser,
  onCloseDelete,
  createMutation,
  updateMutation,
  deleteMutation,
}: UserDialogsProps) {
  return (
    <>
      <UserCreateDialog
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isSubmitting={createMutation.isPending}
      />

      <UserEditDialog
        user={editingUser}
        onClose={onCloseEdit}
        onSubmit={async (data) => {
          if (!editingUser) return;
          await updateMutation.mutateAsync({
            id: editingUser.id,
            payload: {
              name: data.name,
              email: data.email,
              user_type: data.user_type,
              is_active: data.is_active,
              password: data.password,
            },
            meta: {
              department: data.department,
              phone: data.phone,
              location: data.location,
            },
          });
        }}
        isSubmitting={updateMutation.isPending}
      />

      <UserDeleteDialog
        user={deletingUser}
        onClose={onCloseDelete}
        onConfirm={async () => {
          if (!deletingUser) return;
          await deleteMutation.mutateAsync(deletingUser.id);
          onCloseDelete();
        }}
        isSubmitting={deleteMutation.isPending}
      />
    </>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  type UserCreate,
  type UserUpdate,
} from "@/api/users";
import { queryKeys } from "@/api/keys";
import type { MockUserWithMeta } from "@/features/admin/types";
import { getLocalUsers, saveLocalUsers, createSimulatedUser } from "./user-storage";

export function useAdminUsers() {
  return useQuery<MockUserWithMeta[]>({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      try {
        const apiUsers = await listUsers();
        if (apiUsers && apiUsers.length > 0) {
          const localMap = new Map(getLocalUsers().map((u) => [u.email, u]));
          const merged: MockUserWithMeta[] = apiUsers.map((u) => {
            const extra = localMap.get(u.email);
            return {
              ...u,
              department: extra?.department || "Operations",
              phone: extra?.phone || "+94 77 000 0000",
              location: extra?.location || "Colombo HQ",
              assignedHub: extra?.assignedHub,
              assignedVehicle: extra?.assignedVehicle,
            };
          });
          saveLocalUsers(merged);
          return merged;
        }
      } catch {
        // Fallback
      }
      return getLocalUsers();
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: UserCreate & {
        department?: string;
        phone?: string;
        location?: string;
      }
    ) => {
      try {
        const res = await createUser(payload);
        const newUser: MockUserWithMeta = {
          ...res,
          department: payload.department || "Operations",
          phone: payload.phone || "+94 77 000 0000",
          location: payload.location || "Colombo HQ",
        };
        saveLocalUsers([newUser, ...getLocalUsers()]);
        return newUser;
      } catch {
        const simulated = createSimulatedUser(payload);
        saveLocalUsers([simulated, ...getLocalUsers()]);
        return simulated;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      meta,
    }: {
      id: string;
      payload: UserUpdate;
      meta?: { department?: string; phone?: string; location?: string };
    }) => {
      try {
        await updateUser(id, payload);
      } catch {
        // Fallback local
      }
      const updated = getLocalUsers().map((u) =>
        u.id === id
          ? {
              ...u,
              name: payload.name ?? u.name,
              email: payload.email ?? u.email,
              user_type: payload.user_type ?? u.user_type,
              is_active: payload.is_active ?? u.is_active,
              is_verified: payload.is_verified ?? u.is_verified,
              department: meta?.department ?? u.department,
              phone: meta?.phone ?? u.phone,
              location: meta?.location ?? u.location,
              updated_at: new Date().toISOString(),
            }
          : u
      );
      saveLocalUsers(updated);
      return updated.find((u) => u.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deactivateUser(id);
      } catch {
        // Fallback local
      }
      saveLocalUsers(getLocalUsers().filter((u) => u.id !== id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

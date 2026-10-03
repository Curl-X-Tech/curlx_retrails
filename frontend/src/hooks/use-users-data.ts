import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUsersByAdmin,
  createUserByAdmin,
  updateUserById,
  deleteUserById,
  type UserCreatePayload,
  type UserUpdatePayload,
} from "@/lib/api";
import { MOCK_USERS_SEED, type MockUserWithMeta } from "@/data/mock-users";

const LOCAL_USERS_KEY = "retrails_cached_users_v1";

function getLocalUsers(): MockUserWithMeta[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse errors
  }
  return MOCK_USERS_SEED;
}

function saveLocalUsers(users: MockUserWithMeta[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
}

export function useUsersList() {
  return useQuery<MockUserWithMeta[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      try {
        const apiUsers = await listUsersByAdmin();
        if (apiUsers && apiUsers.length > 0) {
          // Merge API users with metadata
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
        // Fallback to local / seed when backend or auth not available
      }
      return getLocalUsers();
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UserCreatePayload & {
        department?: string;
        phone?: string;
        location?: string;
      }
    ) => {
      try {
        const res = await createUserByAdmin(payload);
        const newUser: MockUserWithMeta = {
          ...res,
          department: payload.department || "Operations",
          phone: payload.phone || "+94 77 000 0000",
          location: payload.location || "Colombo HQ",
        };
        const current = getLocalUsers();
        saveLocalUsers([newUser, ...current]);
        return newUser;
      } catch (err) {
        // Local simulation if backend offline
        const simulated: MockUserWithMeta = {
          id: `u-${Date.now()}`,
          email: payload.email,
          name: payload.name,
          user_type: payload.user_type,
          is_active: payload.is_active ?? true,
          is_verified: payload.is_verified ?? true,
          is_superuser: payload.user_type === "system_admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          department: payload.department || "Operations",
          phone: payload.phone || "+94 77 000 0000",
          location: payload.location || "Colombo HQ",
        };
        const current = getLocalUsers();
        saveLocalUsers([simulated, ...current]);
        return simulated;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      meta,
    }: {
      id: string;
      payload: UserUpdatePayload;
      meta?: { department?: string; phone?: string; location?: string };
    }) => {
      try {
        await updateUserById(id, payload);
      } catch {
        // Fallback local update
      }
      const current = getLocalUsers();
      const updated = current.map((u) => {
        if (u.id === id) {
          return {
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
          };
        }
        return u;
      });
      saveLocalUsers(updated);
      return updated.find((u) => u.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteUserById(id);
      } catch {
        // Fallback local delete
      }
      const current = getLocalUsers();
      const filtered = current.filter((u) => u.id !== id);
      saveLocalUsers(filtered);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

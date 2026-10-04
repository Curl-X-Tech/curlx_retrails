import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import type { UserRead, UserCreate, UserUpdate, UserFilters } from "./types";

export async function listUsers(filters?: UserFilters): Promise<UserRead[]> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters?.role && filters.role !== "all") params.role = filters.role;
  if (filters?.depot_id) params.depot_id = filters.depot_id;
  if (filters?.is_active !== undefined && filters.is_active !== "all")
    params.is_active = filters.is_active;
  if (filters?.page) params.page = filters.page;
  if (filters?.pageSize) params.page_size = filters.pageSize;
  if (filters?.search) params.search = filters.search;

  return apiClient<UserRead[]>(ENDPOINTS.usersList.path, {
    method: "GET",
    params,
  });
}

export async function getUser(id: string): Promise<UserRead> {
  const path = ENDPOINTS.usersGet.path.replace("{id}", encodeURIComponent(id));
  return apiClient<UserRead>(path, { method: "GET" });
}

export async function createUser(payload: UserCreate): Promise<UserRead> {
  return apiClient<UserRead>(ENDPOINTS.usersCreate.path, {
    method: "POST",
    body: payload,
  });
}

export async function updateUser(id: string, payload: UserUpdate): Promise<UserRead> {
  const path = ENDPOINTS.usersUpdate.path.replace("{id}", encodeURIComponent(id));
  return apiClient<UserRead>(path, {
    method: "PATCH",
    body: payload,
  });
}

export async function deactivateUser(id: string): Promise<void> {
  const path = ENDPOINTS.usersDelete.path.replace("{id}", encodeURIComponent(id));
  await apiClient<void>(path, { method: "DELETE" });
}

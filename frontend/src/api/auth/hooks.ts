import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/keys";
import {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
} from "./api";
import { getStoredToken } from "./tokens";
import { getCachedSessionFromDexie } from "./session";
import { requestSyncDrain } from "@/sync/events";
import type {
  LoginCredentials,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfilePayload,
  UserProfile,
} from "./types";

export function useCurrentUser() {
  return useQuery<UserProfile | null>({
    queryKey: queryKeys.auth.me(),
    queryFn: async ({ signal }) => {
      const token = getStoredToken();
      if (!token) {
        const cached = await getCachedSessionFromDexie();
        return cached;
      }
      try {
        return await getCurrentUser(signal);
      } catch (err) {
        const cached = await getCachedSessionFromDexie();
        if (cached) return cached;
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
    },
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: RefreshTokenRequest) => refreshToken(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      requestSyncDrain("token-refresh");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => resetPassword(payload),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.auth.me(), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

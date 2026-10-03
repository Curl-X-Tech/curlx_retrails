export type Role = "system_admin" | "dispatcher" | "loader" | "driver" | "store_manager";

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface GuardResponse {
  message: string;
  user_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  user_type?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  depotId?: string;
  depotName?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
}

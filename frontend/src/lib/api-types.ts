export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiUserResponse {
  id: string;
  email: string;
  name: string;
  user_type: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface UserCreatePayload {
  email: string;
  name: string;
  user_type: string;
  password: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  name?: string;
  user_type?: string;
  password?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

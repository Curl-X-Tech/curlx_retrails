export type Role = "system_admin" | "dispatcher" | "loader" | "driver" | "store_manager";

export interface UserRead {
  id: string;
  email: string;
  name: string;
  user_type: Role;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  department?: string;
  phone?: string;
  location?: string;
  assignedHub?: string;
  assignedVehicle?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name?: string;
  user_type?: Role;
  is_active?: boolean;
  is_verified?: boolean;
  department?: string;
  phone?: string;
  location?: string;
  assignedHub?: string;
  assignedVehicle?: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  name?: string;
  user_type?: Role;
  is_active?: boolean;
  is_verified?: boolean;
  department?: string;
  phone?: string;
  location?: string;
  assignedHub?: string;
  assignedVehicle?: string;
}

export interface UserFilters {
  role?: Role | "all" | string;
  depot_id?: string;
  is_active?: boolean | "all";
  page?: number;
  pageSize?: number;
  search?: string;
}

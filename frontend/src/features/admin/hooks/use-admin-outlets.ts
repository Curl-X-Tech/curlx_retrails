import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import type { MasterOutlet, MasterBrand, MasterDepot, MasterDistrict } from "../types";

export function useAdminOutlets() {
  return useQuery<MasterOutlet[]>({
    queryKey: ["master", "outlets"],
    queryFn: () => apiRequest<MasterOutlet[]>("/master/outlets"),
  });
}

export function useAdminBrands() {
  return useQuery<MasterBrand[]>({
    queryKey: ["master", "brands"],
    queryFn: () => apiRequest<MasterBrand[]>("/master/brands"),
  });
}

export function useAdminDepots() {
  return useQuery<MasterDepot[]>({
    queryKey: ["master", "depots"],
    queryFn: () => apiRequest<MasterDepot[]>("/master/depots"),
  });
}

export function useAdminDistricts() {
  return useQuery<MasterDistrict[]>({
    queryKey: ["master", "districts"],
    queryFn: () => apiRequest<MasterDistrict[]>("/master/districts"),
  });
}

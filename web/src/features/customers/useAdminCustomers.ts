import { useQuery } from "@tanstack/react-query";
import { adminListCustomers } from "../../api/customers";

export function useAdminCustomers(search: string, isActive: boolean | null) {
  return useQuery({
    queryKey: ["admin-customers", { search, isActive }],
    queryFn: () => adminListCustomers({ search, isActive }),
    staleTime: 10_000,
  });
}
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTechnicians, type Technician } from "../../api/technicians";

export function useAdminTechnicians(search: string, isActive: boolean | null) {
  return useQuery<Technician[], Error>({
    queryKey: ["adminTechnicians", { search, isActive }],
    queryFn: () => getTechnicians({ search, isActive }),
    staleTime: 15_000,
    placeholderData: keepPreviousData, // REACT QUERY v5 doğru kullanımı...
  });
}
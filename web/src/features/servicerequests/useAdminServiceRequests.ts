import { useQuery } from "@tanstack/react-query";
import type { PagedResponse } from "../../api/workorders";
import {
  adminListServiceRequests,
  type ServiceRequestListItemDto,
  type ServiceRequestListQuery,
} from "../../api/serviceRequests";

export function useAdminServiceRequests(query: ServiceRequestListQuery) {
  return useQuery<PagedResponse<ServiceRequestListItemDto>, Error>({
    queryKey: ["service-requests", "list", query],
    queryFn: () => adminListServiceRequests(query),
    staleTime: 15_000,
    // Sayfa/filtre geçişlerinde önceki veriyi göstermeye devam et,
    // yeni sonuç yüklenene kadar UI boş kalmasın
    placeholderData: (prev) => prev,
  });
}

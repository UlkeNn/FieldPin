import { useQuery } from "@tanstack/react-query";

import {
  getWorkOrdersByTechnician,
  type PagedResponse,
  type WorkOrderDetailDto,
} from "../../api/workorders";

export function useWorkOrdersByTech(
  technicianId: string,
  page: number = 1,
  pageSize: number = 15,
) {
  return useQuery<PagedResponse<WorkOrderDetailDto>, Error>({
    queryKey: ["workorders", "by-tech", technicianId, { page, pageSize }],
    queryFn: () => getWorkOrdersByTechnician(technicianId, page, pageSize),
    enabled: technicianId.length > 0,
    staleTime: 15_000,
    // Sayfa geçişlerinde önceki veriyi göstermeye devam et,
    // yeni sayfa yüklenene kadar UI boş kalmasın
    placeholderData: (prev) => prev,
  });
}
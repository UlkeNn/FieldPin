import { useQuery } from "@tanstack/react-query";
import { getWorkOrderById, type WorkOrderDetailDto } from "../../api/workorders";

export function useWorkOrder(id: string | null) {
  return useQuery<WorkOrderDetailDto, Error>({
    queryKey: ["workorders", "detail", id],
    queryFn: () => getWorkOrderById(id as string),
    enabled: typeof id === "string" && id.length > 0,
    staleTime: 15_000,
  });
}
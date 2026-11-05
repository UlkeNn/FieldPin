import { useQuery } from "@tanstack/react-query";
import {
  adminGetServiceRequestById,
  type ServiceRequestDetailDto,
} from "../../api/serviceRequests";

export function useServiceRequest(id: string | null) {
  return useQuery<ServiceRequestDetailDto, Error>({
    queryKey: ["service-requests", "detail", id],
    queryFn: () => adminGetServiceRequestById(id as string),
    enabled: typeof id === "string" && id.length > 0,
    staleTime: 15_000,
  });
}

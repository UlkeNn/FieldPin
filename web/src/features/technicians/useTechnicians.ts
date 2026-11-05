import { useQuery } from "@tanstack/react-query";
import { getTechnicians } from "../../api/technicians";

export function useTechnicians() {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: () => getTechnicians(), 
    staleTime: 15_000,
  });
}
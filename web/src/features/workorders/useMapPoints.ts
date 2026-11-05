import { useQuery } from '@tanstack/react-query';
import { getWorkOrderMapPoints,type MapQueryRequest } from '../../api/map';

export const useMapPoints = (filters: MapQueryRequest) => {
  return useQuery({
    queryKey: ['workorder-map-points', filters],
    queryFn: () => getWorkOrderMapPoints(filters),
    // Sadece fromDate ve toDate varsa istek atması için:
    enabled: !!filters.fromDate && !!filters.toDate, 
  });
};
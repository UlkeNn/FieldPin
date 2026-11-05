import { http } from "./http";

// ─────────────────────────────────────────────────────────────
// Harita endpointleri için DTO'lar ve istek tipleri
// Backend: GET /api/WorkOrders/map (MapQueryRequest, MapPointResponse)
// ─────────────────────────────────────────────────────────────

export type WorkOrderMapPointDto = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
  systemType: number;
  jobType: number;
  technicianId: string;
  customerName?: string;
  notes?: string | null;
  createdAt: string;
};

export type MapQueryRequest = {
  fromDate?: string;          // YYYY-MM-DD
  toDate?: string;            // YYYY-MM-DD
  technicianId?: string;
  customerId?: string;
  systemType?: number;        // 1=Sistem 1, 2=Sistem 2
  jobType?: number;           // 1=Montage, 2=Replace, 3=Fault
};

export const getWorkOrderMapPoints = async (
  params: MapQueryRequest
): Promise<WorkOrderMapPointDto[]> => {
  const response = await http.get<WorkOrderMapPointDto[]>("/api/WorkOrders/map", {
    // Backend (C# / ASP.NET) PascalCase isimleri okur; alttaki anahtarları
    // controller'daki MapQueryRequest property isimleriyle eşle.
    params: {
      From: params.fromDate,
      To: params.toDate,
      TechnicianId: params.technicianId || undefined,
      CustomerId: params.customerId || undefined,
      SystemType: params.systemType || undefined,
      JobType: params.jobType || undefined,
    },
  });
  return response.data;
};
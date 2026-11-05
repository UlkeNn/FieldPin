// src/features/servicerequests/api/servicerequests.api.ts
//
// Teknisyen-scope'lu Talep (ServiceRequest) endpoint'leri.
// Kaynak: backend API sözleşmesi (service-requests) §2
// (Technician — Service Requests, api/service-requests). Sunucu tarafında her zaman
// assignedUserId == token'daki userId filtresi uygulanır; teknisyen yalnızca kendine
// atanan talepleri görür/günceller.

import { httpFormData, httpJson } from "../../../lib/http";
import type { PagedResponse, RNFile } from "../../workorders/api/workorders.api";
import type { CustomerDto } from "../../customers/api/customers.api";

// ─── Liste satırı ────────────────────────────────────────────────────────

export type ServiceRequestListItemDto = {
  id: string;
  requestNo: string;
  title: string;
  status: number; // RequestStatus
  priority: number; // RequestPriority
  source: number; // RequestSource
  systemType: number;
  jobType: number;
  customer?: CustomerDto | null;
  createdAtUtc: string;
  slaDueAtUtc?: string | null;
  isOverdue: boolean;
  workOrderCount: number;
  mediaCount: number;
};

// ─── Medya ───────────────────────────────────────────────────────────────

export type ServiceRequestMediaDto = {
  id: string;
  url: string;
  fileName: string;
  originalFileName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt: string; // DİKKAT: diğer talep alanları *Utc soneki alıyor, bu almıyor.
};

// ─── Talebe bağlı iş emri özeti ────────────────────────────────────────────

export type ServiceRequestWorkOrderRefDto = {
  id: string;
  systemType: number;
  jobType: number;
  technicianId: string;
  createdAt: string; // DİKKAT: burada da *Utc soneki yok.
};

// ─── Detay ───────────────────────────────────────────────────────────────

export type ServiceRequestDetailDto = ServiceRequestListItemDto & {
  description?: string | null;
  deviceType?: number | null; // ObjectType değerleriyle aynı sayı uzayı (workorder.enums.ts)
  deviceIdentifier?: string | null;
  createdByUserId?: string | null;
  requesterName?: string | null;
  requesterPhone?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  assignedAtUtc?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationCapturedAt?: string | null;
  locationSource?: number | null; // LocationSource (workorder.enums.ts)
  updatedAtUtc?: string | null;
  completedAtUtc?: string | null;
  resolutionNote?: string | null;
  rawPayload?: string | null;
  rowVersion?: string | null;
  media: ServiceRequestMediaDto[];
  workOrders: ServiceRequestWorkOrderRefDto[];
};

// ─── Durum değiştirme ───────────────────────────────────────────────────

export type ChangeServiceRequestStatusRequest = {
  status: number; // RequestStatus
  resolutionNote?: string | null;
};

// ─── Endpoint'ler ──────────────────────────────────────────────────────

export async function getMyServiceRequests(
  page: number = 1,
  pageSize: number = 15,
): Promise<PagedResponse<ServiceRequestListItemDto>> {
  return httpJson<PagedResponse<ServiceRequestListItemDto>>(
    `/api/service-requests/my?page=${page}&pageSize=${pageSize}`,
    { method: "GET" },
  );
}

export async function getServiceRequestById(id: string) {
  try {
    return await httpJson<ServiceRequestDetailDto>(`/api/service-requests/${id}`, {
      method: "GET",
    });
  } catch (e: any) {
    // Teknisyen kendine atanmamış bir talebe erişmeye çalışırsa backend boş gövdeyle
    // 403 döner (bkz. doküman); http.ts genel mesajı "HTTP 403" olur, burada anlamlı
    // bir Türkçe mesaja çeviriyoruz.
    if (e?.status === 403) {
      throw new Error("Bu talep size atanmamış.");
    }
    throw e;
  }
}

export async function changeServiceRequestStatus(
  id: string,
  payload: ChangeServiceRequestStatusRequest,
) {
  return httpJson<void>(`/api/service-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadServiceRequestMedia(id: string, files: RNFile[]) {
  const form = new FormData();
  for (const f of files) {
    form.append("files", {
      uri: f.uri,
      name: f.name,
      type: f.type,
    } as any);
  }

  return httpFormData<ServiceRequestMediaDto[]>(`/api/service-requests/${id}/media`, form);
}

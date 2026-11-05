// src/api/serviceRequests.ts
import { http } from "./http";
import type { PagedResponse } from "./workorders";

// ── Ortak alt tipler ─────────────────────────────────────────

export type ServiceRequestCustomerDto = {
  id: string;
  name?: string | null;
  info?: string | null;
  phone?: string | null;
};

export type ServiceRequestMediaDto = {
  id: string;
  url: string;
  fileName: string;
  originalFileName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
};

export type ServiceRequestWorkOrderDto = {
  id: string;
  systemType: number;
  jobType: number;
  technicianId: string;
  createdAt: string;
};

// ── Liste satırı — media/workOrders dizisi YOK, sadece sayaçlar ──

export type ServiceRequestListItemDto = {
  id: string;
  requestNo: string;
  title: string;
  status: number;
  priority: number;
  source: number;
  systemType: number;
  jobType: number;
  customer?: ServiceRequestCustomerDto | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  createdAtUtc: string;
  slaDueAtUtc?: string | null;
  isOverdue: boolean;
  workOrderCount: number;
  mediaCount: number;
};

// ── Detay ──

export type ServiceRequestDetailDto = {
  id: string;
  requestNo: string;
  title: string;
  description?: string | null;
  systemType: number;
  jobType: number;
  priority: number;
  status: number;
  source: number;
  customer?: ServiceRequestCustomerDto | null;
  deviceType?: number | null;
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
  locationSource?: number | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  slaDueAtUtc?: string | null;
  completedAtUtc?: string | null;
  resolutionNote?: string | null;
  isOverdue: boolean;
  rawPayload?: string | null;
  rowVersion: string;
  media: ServiceRequestMediaDto[];
  workOrders: ServiceRequestWorkOrderDto[];
};

// ── Liste sorgusu ──

export type ServiceRequestListQuery = {
  q?: string;
  status?: number;
  priority?: number;
  source?: number;
  systemType?: number;
  jobType?: number;
  customerId?: string;
  assignedUserId?: string;
  unassigned?: boolean;
  overdueOnly?: boolean;
  from?: string; // ISO / YYYY-MM-DD
  to?: string; // ISO / YYYY-MM-DD — backend gün sonuna kadar dahil ediyor
  sort?: string; // "createdAt" | "priority" | "slaDueAt", "-" öneki azalan
  page?: number;
  pageSize?: number;
};

// ── Create / Update / aksiyon gövdeleri ──

export type CreateServiceRequestRequest = {
  title: string;
  description?: string | null;
  systemType: number;
  jobType: number;
  priority: number;
  source: number;
  customerId?: string | null;
  deviceType?: number | null;
  deviceIdentifier?: string | null;
  requesterName?: string | null;
  requesterPhone?: string | null;
  assignedUserId?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationCapturedAt?: string | null;
  locationSource?: number | null;
  slaDueAtUtc?: string | null;
  rawPayload?: string | null;
};

// Partial update: alan gönderilmezse/ null ise dokunulmaz (title hariç).
export type UpdateServiceRequestRequest = {
  title?: string | null;
  description?: string | null;
  systemType?: number | null;
  jobType?: number | null;
  priority?: number | null;
  customerId?: string | null;
  deviceType?: number | null;
  deviceIdentifier?: string | null;
  requesterName?: string | null;
  requesterPhone?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationCapturedAt?: string | null;
  locationSource?: number | null;
  slaDueAtUtc?: string | null;
  rawPayload?: string | null;
  rowVersion?: string | null;
};

export type AssignServiceRequestRequest = {
  assignedUserId: string;
  slaDueAtUtc?: string | null;
};

export type ChangeServiceRequestStatusRequest = {
  status: number;
  resolutionNote?: string | null;
};

export type CreateWorkOrderFromRequestRequest = {
  technicianId?: string | null;
  notes?: string | null;
};

export type CreateWorkOrderFromRequestResponse = {
  workOrderId: string;
};

// ── API çağrıları — Admin Service Requests ─────────────────────

export async function adminListServiceRequests(
  query: ServiceRequestListQuery = {},
): Promise<PagedResponse<ServiceRequestListItemDto>> {
  const res = await http.get<PagedResponse<ServiceRequestListItemDto>>(
    "/api/admin/service-requests",
    {
      params: {
        q: query.q || undefined,
        status: query.status ?? undefined,
        priority: query.priority ?? undefined,
        source: query.source ?? undefined,
        systemType: query.systemType ?? undefined,
        jobType: query.jobType ?? undefined,
        customerId: query.customerId || undefined,
        assignedUserId: query.assignedUserId || undefined,
        unassigned: query.unassigned ?? undefined,
        overdueOnly: query.overdueOnly ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined,
        sort: query.sort || undefined,
        page: query.page ?? undefined,
        pageSize: query.pageSize ?? undefined,
      },
    },
  );
  return res.data;
}

export async function adminGetServiceRequestById(
  id: string,
): Promise<ServiceRequestDetailDto> {
  const res = await http.get<ServiceRequestDetailDto>(
    `/api/admin/service-requests/${id}`,
  );
  return res.data;
}

export async function adminCreateServiceRequest(
  payload: CreateServiceRequestRequest,
): Promise<ServiceRequestDetailDto> {
  const res = await http.post<ServiceRequestDetailDto>(
    "/api/admin/service-requests",
    payload,
  );
  return res.data;
}

export async function adminUpdateServiceRequest(
  id: string,
  payload: UpdateServiceRequestRequest,
): Promise<void> {
  // 204 No Content
  await http.put(`/api/admin/service-requests/${id}`, payload);
}

export async function adminAssignServiceRequest(
  id: string,
  payload: AssignServiceRequestRequest,
): Promise<void> {
  // 204 No Content
  await http.patch(`/api/admin/service-requests/${id}/assign`, payload);
}

export async function adminChangeServiceRequestStatus(
  id: string,
  payload: ChangeServiceRequestStatusRequest,
): Promise<void> {
  // 204 No Content
  await http.patch(`/api/admin/service-requests/${id}/status`, payload);
}

/**
 * Talebe fotoğraf/dosya ekler. Form alanı adı backend gereği "files".
 * http instance'ı varsayılan olarak application/json header'ı taşıyor;
 * multipart isteğinde bunu kaldırmak gerekiyor ki tarayıcı doğru
 * boundary'li Content-Type'ı kendisi koysun.
 */
export async function adminUploadServiceRequestMedia(
  id: string,
  files: File[],
): Promise<ServiceRequestMediaDto[]> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const res = await http.post<ServiceRequestMediaDto[]>(
    `/api/admin/service-requests/${id}/media`,
    fd,
    { headers: { "Content-Type": undefined } },
  );
  return res.data;
}

export async function adminDeleteServiceRequestMedia(
  id: string,
  mediaId: string,
): Promise<void> {
  // 204 No Content
  await http.delete(`/api/admin/service-requests/${id}/media/${mediaId}`);
}

export async function adminCreateWorkOrderFromRequest(
  id: string,
  payload: CreateWorkOrderFromRequestRequest = {},
): Promise<CreateWorkOrderFromRequestResponse> {
  const res = await http.post<CreateWorkOrderFromRequestResponse>(
    `/api/admin/service-requests/${id}/work-orders`,
    payload,
  );
  return res.data;
}

export async function adminLinkWorkOrderToRequest(
  id: string,
  workOrderId: string,
): Promise<void> {
  // 204 No Content
  await http.post(`/api/admin/service-requests/${id}/work-orders/link`, {
    workOrderId,
  });
}

/**
 * Soft delete: Backend DELETE /api/admin/service-requests/{id}
 * Kaydı DB'den silmez; isDeleted=true set eder, listelerde görünmez olur.
 */
export async function adminSoftDeleteServiceRequest(id: string): Promise<void> {
  // 204 No Content
  await http.delete(`/api/admin/service-requests/${id}`);
}

// ── LABEL HELPERS ────────────────────────────────────────────

export const REQUEST_STATUS = {
  New: 1,
  Assigned: 2,
  InProgress: 3,
  OnHold: 4,
  Completed: 5,
  Cancelled: 6,
} as const;

export const REQUEST_PRIORITY = {
  Low: 1,
  Normal: 2,
  High: 3,
  Critical: 4,
} as const;

export const REQUEST_SOURCE = {
  Web: 1,
  WhatsApp: 2,
  WhatsAppAi: 3,
  Email: 4,
  Phone: 5,
} as const;

export const LOCATION_SOURCE = {
  Gps: 1,
  Network: 2,
  Manual: 3,
} as const;

export function requestStatusLabel(n: number): string {
  if (n === REQUEST_STATUS.New) return "Yeni";
  if (n === REQUEST_STATUS.Assigned) return "Atandı";
  if (n === REQUEST_STATUS.InProgress) return "İşlemde";
  if (n === REQUEST_STATUS.OnHold) return "Beklemede";
  if (n === REQUEST_STATUS.Completed) return "Tamamlandı";
  if (n === REQUEST_STATUS.Cancelled) return "İptal";
  return `STATUS-${n}`;
}

export function requestPriorityLabel(n: number): string {
  if (n === REQUEST_PRIORITY.Low) return "Düşük";
  if (n === REQUEST_PRIORITY.Normal) return "Normal";
  if (n === REQUEST_PRIORITY.High) return "Yüksek";
  if (n === REQUEST_PRIORITY.Critical) return "Kritik";
  return `PRIORITY-${n}`;
}

export function requestSourceLabel(n: number): string {
  if (n === REQUEST_SOURCE.Web) return "Web";
  if (n === REQUEST_SOURCE.WhatsApp) return "WhatsApp";
  if (n === REQUEST_SOURCE.WhatsAppAi) return "WhatsApp (AI)";
  if (n === REQUEST_SOURCE.Email) return "E-posta";
  if (n === REQUEST_SOURCE.Phone) return "Telefon";
  return `SOURCE-${n}`;
}

export function locationSourceLabel(n?: number | null): string {
  if (n === LOCATION_SOURCE.Gps) return "GPS";
  if (n === LOCATION_SOURCE.Network) return "Ağ";
  if (n === LOCATION_SOURCE.Manual) return "Elle";
  return "-";
}

import { httpFormData, httpJson } from "../../../lib/http";
import {CustomerDto} from "../../customers/api/customers.api"
import { LocationSource } from "../types/workorder.enums";

export type RNFile = { uri: string; name: string; type: string };

// ─── Generic Pagination Response ──────────────────────────────────────────
// Backend'deki PagedResponse<T> ile birebir eşleşir.
export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type WorkOrderObjectMediaDto = {
  id: string;
  url: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

// ─── Konum alanları (ortak) ────────────────────────────────────────────────
// Backend wire format ile birebir (camelCase). Hepsi opsiyonel.
// Kural: latitude ve longitude birlikte gönderilmeli; biri varsa diğeri de olmalı.
export type WorkOrderLocationFields = {
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationCapturedAt?: string | null; // ISO 8601 UTC, örn. "2026-04-27T08:31:14Z"
  locationSource?: LocationSource | null;
};
 

export type CreateWorkOrderRequest = {
  systemType: number;
  jobType: number;
  customerId?: string | null;
  notes?: string | null;

  faultCause?: string | null;
  faultResolution?: string | null;

  technicianId?: string | null; // Admin ise gönderir

  // Talepten üretilen iş emrini talebe bağlar (bkz. service-requests.md, en sondaki not).
  // Verilirse talep var ve silinmemiş olmalı, yoksa backend 400 döner.
  serviceRequestId?: string | null;
} & WorkOrderLocationFields;
 
export type CreateWorkOrderResponse = { id: string };
 
export type BatchObjectDto = {
  objectType: number;
  objectIdentifier: string;
  notes?: string | null;
  role?: number; // WorkOrderObjectRole
};
 
export type BatchObjectResult = {
  id: string;
  objectType: number;
  role: number;
  objectIdentifier: string;
};
 
export async function createWorkOrder(payload: CreateWorkOrderRequest) {
  return httpJson<CreateWorkOrderResponse>("/api/WorkOrders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
 
export async function createObjectsBatch(workOrderId: string, items: BatchObjectDto[]) {
  return httpJson<BatchObjectResult[]>(`/api/WorkOrders/${workOrderId}/objects/batch`, {
    method: "POST",
    body: JSON.stringify(items),
  });
}
 
export async function uploadObjectMedia(objectId: string, files: RNFile[]) {
  const form = new FormData();
  for (const f of files) {
    form.append("files", {
      uri: f.uri,
      name: f.name,
      type: f.type,
    } as any);
  }
 
  // httpFormData(url, formData) şeklinde çağır
  return httpFormData<WorkOrderObjectMediaDto[]>(
    `/api/workorder-objects/${objectId}/media`,
    form
  );
}
 
// ─── Ortak DTO'lar ─────────────────────────────────────────────────────────
 
export type WorkOrderObjectDto = {
  id: string;
  objectType: number;
  role: number;
  objectIdentifier: string | null;
  notes?: string | null;
  createdAt: string;
  media: WorkOrderObjectMediaDto[];
};
 
export type WorkOrderDto = {
  id: string;
  systemType: number;
  jobType: number;
  technicianId?: string;
  customer?: CustomerDto | null;
  notes?: string | null;
  faultCause?: string | null;
  faultResolution?: string | null;
  createdAt: string;
  objects: WorkOrderObjectDto[];
  // Bir talepten üretildiyse o talebin id'si, aksi halde null.
  serviceRequestId?: string | null;
} & WorkOrderLocationFields;
 
// ─── Liste (History) — Paginated ──────────────────────────────────────────
 
export async function getMyWorkOrders(
  page: number = 1,
  pageSize: number = 15,
): Promise<PagedResponse<WorkOrderDto>> {
  const raw = await httpJson<PagedResponse<WorkOrderDto> | WorkOrderDto[]>(
    `/api/WorkOrders/my?page=${page}&pageSize=${pageSize}`,
    { method: "GET" },
  );
 
  // Backend henüz pagination dönmüyorsa düz array gelir — sarmalıyoruz
  if (Array.isArray(raw)) {
    return {
      items: raw,
      page: 1,
      pageSize: raw.length,
      totalCount: raw.length,
      totalPages: 1,
    };
  }
 
  return raw;
}
 
// ─── Detay ─────────────────────────────────────────────────────────────────
 
export async function getWorkOrderById(id: string) {
  return httpJson<WorkOrderDto>(`/api/WorkOrders/${id}`, { method: "GET" });
}
 
// ─── Harita (Map) ──────────────────────────────────────────────────────────
 
// Backend cevabı: WorkOrderMapPointDto[] — sadece konumu olan kayıtlar.
// DİKKAT: Map endpoint'i `accuracy` ve `source` döner (locationAccuracy/locationSource değil).
export type WorkOrderMapPointDto = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  source?: LocationSource | null;
  systemType: number;
  jobType: number;
  technicianId?: string | null;
  customerName?: string | null;
  createdAt: string;
};
 
// GET /api/WorkOrders/map için query parametreleri — hepsi opsiyonel.
// Tarihler ISO 8601 UTC string. Teknisyen rolünde technicianId server tarafında zorla
// kullanıcının kendi id'sine kilitlenir; gönderilse de etkisi olmaz.
export type MapQueryRequest = {
  from?: string | null;
  to?: string | null;
  technicianId?: string | null;
  customerId?: string | null;
  systemType?: number | null;
  jobType?: number | null;
  minLat?: number | null;
  maxLat?: number | null;
  minLng?: number | null;
  maxLng?: number | null;
};
 
function buildMapQueryString(query: MapQueryRequest): string {
  const params: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return params.length ? `?${params.join("&")}` : "";
}
 
export async function getWorkOrderMap(query: MapQueryRequest = {}) {
  const qs = buildMapQueryString(query);
  return httpJson<WorkOrderMapPointDto[]>(`/api/WorkOrders/map${qs}`, { method: "GET" });
}
 
// ─── Konum Güncelleme (PATCH) ──────────────────────────────────────────────
 
// PATCH /api/WorkOrders/{id}/location
// latitude ve longitude zorunlu (backend kuralı).
// Boş bırakılan locationCapturedAt → server UtcNow atar.
// Boş bırakılan locationSource → server Manual atar.
export type UpdateLocationRequest = {
  latitude: number;
  longitude: number;
  locationAccuracy?: number | null;
  locationCapturedAt?: string | null;
  locationSource?: LocationSource | null;
};
 
// 204 NoContent döner — body yoktur, void cast ediyoruz.
export async function updateWorkOrderLocation(id: string, payload: UpdateLocationRequest) {
  return httpJson<void>(`/api/WorkOrders/${id}/location`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
 



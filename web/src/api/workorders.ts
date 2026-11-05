import { http } from "./http";

// ── Generic Pagination Response ──────────────────────────
// Backend'deki PagedResponse<T> ile birebir eşleşi
// İleride başka endpoint'ler de paginated olursa aynı tip kullanılacak.
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
  originalFileName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
};

export type WorkOrderObjectDto = {
  id: string;
  objectType: number;
  objectIdentifier: string;
  role?: number;
  createdAt: string;
  media?: WorkOrderObjectMediaDto[];
  url?: string | null;          //backend Url -> JSON url
  contentType?: string | null;
  sizeBytes?: number | null;
};

export type CustomerDto = {
  id: string;
  name?: string | null;
  phone?: string | null;
};


export type WorkOrderDetailDto = {
  id: string;
  systemType: number;
  jobType: number;
  technicianId: string;
  customer?: CustomerDto | null;
  notes?: string | null;
  createdAt: string; // sende entity CreatedAt ise bu isim
  objects: WorkOrderObjectDto[];

  latitude?: number | null;
  longitude?: number | null;
};


//-------------APICALLS--------------------------------
//Paginated: GET /api/WorkOrders/by-tech/{technicianId}?page=1&pageSize=15
export async function getWorkOrdersByTechnician(
  technicianId: string,
  page: number = 1,
  pageSize: number = 15,
): Promise<PagedResponse<WorkOrderDetailDto>> {
  const res = await http.get<PagedResponse<WorkOrderDetailDto>>(
    `/api/WorkOrders/by-tech/${technicianId}`,
    { params: { page, pageSize } },
  );
  return res.data;
}

export async function getWorkOrderById(id: string): Promise<WorkOrderDetailDto> {
  const res = await http.get<WorkOrderDetailDto>(`/api/WorkOrders/${id}`);
  return res.data;
}

//LABEL HELPERS_________________________________
export const SYSTEM_TYPE = {
  System1: 1,
  System2: 2,
} as const;

export const JOB_TYPE = {
  Montage: 1,
  Replace: 2,
  Fault: 3,
} as const;

export const WORK_ORDER_OBJECT_ROLE = {
  Single: 0,
  Old: 1,
  New: 2,
} as const;

export function systemTypeLabel(n: number) {
  if (n === SYSTEM_TYPE.System1) return "Sistem 1";
  if (n === SYSTEM_TYPE.System2) return "Sistem 2";
  return `SYSTEM-${n}`;
}

export function jobTypeLabel(n: number) {
  if (n === JOB_TYPE.Montage) return "Montaj";
  if (n === JOB_TYPE.Replace) return "Değişim";
  if (n === JOB_TYPE.Fault) return "Arıza";
  return `JOB-${n}`;
}

export function workOrderObjectRoleLabel(n?: number){
  if ( n=== WORK_ORDER_OBJECT_ROLE.Single) return "Tek";
  if (n===WORK_ORDER_OBJECT_ROLE.Old) return "Eski";
  if (n===WORK_ORDER_OBJECT_ROLE.New) return "Yeni";
  return "-";
}
//--------------------------------------------
import { http } from "./http";

export type CustomerDto = {
  id: string;
  name?: string | null;
  info?: string | null;
  phone?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAtUtc: string; // ISO string
};

export type CreateCustomerRequest = {
  name: string;
  info?: string | null;
  phone?: string | null;
};

export type UpdateCustomerRequest = {
  name?: string | null;
  info?: string | null;
  phone?: string | null;
  isActive?: boolean | null;
};

export type AdminCustomerListParams = {
  search?: string | null;
  isActive?: boolean | null; // null => hepsi
};

export async function adminListCustomers(params: AdminCustomerListParams = {}) {
  const res = await http.get<CustomerDto[]>("/api/admin/customers", {
    params: {
      search: params.search ?? undefined,
      isActive: params.isActive ?? undefined,
    },
  });
  return res.data;
}

export async function adminGetCustomerById(id: string) {
  const res = await http.get<CustomerDto>(`/api/admin/customers/${id}`);
  return res.data;
}

export async function adminCreateCustomer(payload: CreateCustomerRequest) {
  const res = await http.post<CustomerDto>("/api/admin/customers", payload);
  return res.data;
}

export async function adminUpdateCustomer(id: string, payload: UpdateCustomerRequest) {
  // 204 No Content
  await http.put(`/api/admin/customers/${id}`, payload);
}

export async function adminSetCustomerActivation(id: string, isActive: boolean) {
  // 204 No Content
  await http.patch(`/api/admin/customers/${id}/activation`, { isActive });
}

/**
 * Soft delete: Backend DELETE /api/admin/customers/{id}
 * Kaydı DB'den silmez; IsDeleted=true, IsActive=false set eder.
 * Silinen kayıt hiçbir listede görünmez.
 */
export async function adminSoftDeleteCustomer(id: string) {
  // 204 No Content
  await http.delete(`/api/admin/customers/${id}`);
}
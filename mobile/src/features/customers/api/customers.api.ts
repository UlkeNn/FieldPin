// src/features/customers/api/customers.api.ts
import { httpJson } from "@/src/lib/http";

export type CustomerDto = {
  id: string;
  name?: string | null;
  info?: string | null;
  phone?: string | null;
};

export async function getActiveCustomers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return httpJson<CustomerDto[]>(`/api/customers${qs}`, { method: "GET" });
}
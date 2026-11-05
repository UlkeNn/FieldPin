//src/api/technicians.ts

import { http } from "./http";

// DTO ile uyumlu Technician modeli
export type Technician = {
  id: string;
  username: string;
  role: "Admin" | "Technician" | string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAtUtc?: string;

  // yeni alanlar (backend gönderirse dolu gelir)
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthDate?: string | null; // "YYYY-MM-DD" veya ISO

  avatarUrl?: string | null; // profil resmi URLi
};

export type CreateTechnicianRequest = {
  username: string;
  password: string;
  role?: "Admin" | "Technician" | string;

  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthDate?: string | null; // "YYYY-MM-DD"
};

export type UpdateTechnicianRequest = {
  username?: string;
  role?: "Admin" | "Technician" | string;
  isActive?: boolean;

  newPassword?: string;

  // UI'da boşaltınca null'a çekmek için backend tarafında "" => null mantığı iyi.
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthDate?: string | null;
};

export async function getTechnicians(params?: {
  search?: string;
  isActive?: boolean | null;
}): Promise<Technician[]> {
  const res = await http.get<Technician[]>("/api/admin/technicians", {
    params: {
      search: params?.search || undefined,
      isActive: params?.isActive ?? undefined,
    },
  });
  return res.data;
}

// POST /api/admin/technicians
export async function createTechnician(
  body: CreateTechnicianRequest
): Promise<Technician> {
  const res = await http.post<Technician>("/api/admin/technicians", body);
  return res.data;
}

// PUT /api/admin/technicians/{id}
export async function updateTechnician(
  id: string,
  body: UpdateTechnicianRequest
): Promise<void> {
  await http.put(`/api/admin/technicians/${id}`, body);
}

/**
 * Pasife alma / aktif etme.
 * Backend'de ayrı bir activation endpoint'i yok; PUT /{id} ile sadece isActive gönderilir.
 */
export async function setTechnicianActivation(id: string, isActive: boolean): Promise<void> {
  await http.put(`/api/admin/technicians/${id}`, { isActive });
}

/**
 * DELETE /api/admin/technicians/{id}
 * Backend artık bu endpoint'te soft-delete yapıyor:
 *   IsDeleted = true, IsActive = false
 * Silinen kayıt hiçbir listede görünmez (backend !IsDeleted filtresi ile elenir).
 */
export async function softDeleteTechnician(id: string): Promise<void> {
  await http.delete(`/api/admin/technicians/${id}`);
}

/**
 * @deprecated `softDeleteTechnician` kullanın.
 * Geriye uyumluluk için bırakıldı; aynı endpoint'i çağırır.
 */
export async function deactivateTechnician(id: string): Promise<void> {
  await softDeleteTechnician(id);
}
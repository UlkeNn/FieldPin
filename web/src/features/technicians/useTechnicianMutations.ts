import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTechnician,
  updateTechnician,
  softDeleteTechnician,
  setTechnicianActivation,
  type CreateTechnicianRequest,
  type UpdateTechnicianRequest,
} from "../../api/technicians";

export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTechnicianRequest) => createTechnician(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      qc.invalidateQueries({ queryKey: ["adminTechnicians"] });
    },
  });
}

export function useUpdateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTechnicianRequest }) =>
      updateTechnician(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      qc.invalidateQueries({ queryKey: ["adminTechnicians"] });
    },
  });
}

/**
 * Teknisyeni pasif/aktif yapar (IsDeleted'a dokunmaz).
 */
export function useSetTechnicianActivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setTechnicianActivation(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      qc.invalidateQueries({ queryKey: ["adminTechnicians"] });
    },
  });
}

/**
 * Soft delete (IsDeleted = true, IsActive = false).
 * Backend DELETE /api/admin/technicians/{id} çağrılır.
 */
export function useSoftDeleteTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteTechnician(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      qc.invalidateQueries({ queryKey: ["adminTechnicians"] });
    },
  });
}

/**
 * @deprecated `useSoftDeleteTechnician` kullanın.
 * Geriye uyumluluk için bırakıldı; aynı mutation'ı döner.
 */
export const useDeactivateTechnician = useSoftDeleteTechnician;
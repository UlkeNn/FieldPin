import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminAssignServiceRequest,
  adminChangeServiceRequestStatus,
  adminCreateServiceRequest,
  adminCreateWorkOrderFromRequest,
  adminDeleteServiceRequestMedia,
  adminLinkWorkOrderToRequest,
  adminSoftDeleteServiceRequest,
  adminUpdateServiceRequest,
  adminUploadServiceRequestMedia,
  type AssignServiceRequestRequest,
  type ChangeServiceRequestStatusRequest,
  type CreateServiceRequestRequest,
  type CreateWorkOrderFromRequestRequest,
  type UpdateServiceRequestRequest,
} from "../../api/serviceRequests";

export function useServiceRequestMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["service-requests"] });
  };

  // Talepten iş emri üretildiğinde / bağlandığında "Yapılan İşler"
  // sayfası da bayat kalmasın diye workorders'ı da invalidate ediyoruz.
  const invalidateWithWorkOrders = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["service-requests"] }),
      qc.invalidateQueries({ queryKey: ["workorders"] }),
    ]);
  };

  const createRequest = useMutation({
    mutationFn: (payload: CreateServiceRequestRequest) =>
      adminCreateServiceRequest(payload),
    onSuccess: invalidate,
  });

  const updateRequest = useMutation({
    mutationFn: (args: { id: string; payload: UpdateServiceRequestRequest }) =>
      adminUpdateServiceRequest(args.id, args.payload),
    onSuccess: invalidate,
  });

  const assignRequest = useMutation({
    mutationFn: (args: { id: string; payload: AssignServiceRequestRequest }) =>
      adminAssignServiceRequest(args.id, args.payload),
    onSuccess: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: (args: {
      id: string;
      payload: ChangeServiceRequestStatusRequest;
    }) => adminChangeServiceRequestStatus(args.id, args.payload),
    onSuccess: invalidate,
  });

  const uploadMedia = useMutation({
    mutationFn: (args: { id: string; files: File[] }) =>
      adminUploadServiceRequestMedia(args.id, args.files),
    onSuccess: invalidate,
  });

  const deleteMedia = useMutation({
    mutationFn: (args: { id: string; mediaId: string }) =>
      adminDeleteServiceRequestMedia(args.id, args.mediaId),
    onSuccess: invalidate,
  });

  const createWorkOrder = useMutation({
    mutationFn: (args: {
      id: string;
      payload: CreateWorkOrderFromRequestRequest;
    }) => adminCreateWorkOrderFromRequest(args.id, args.payload),
    onSuccess: invalidateWithWorkOrders,
  });

  const linkWorkOrder = useMutation({
    mutationFn: (args: { id: string; workOrderId: string }) =>
      adminLinkWorkOrderToRequest(args.id, args.workOrderId),
    onSuccess: invalidateWithWorkOrders,
  });

  const softDeleteRequest = useMutation({
    mutationFn: (id: string) => adminSoftDeleteServiceRequest(id),
    onSuccess: invalidate,
  });

  return {
    createRequest,
    updateRequest,
    assignRequest,
    changeStatus,
    uploadMedia,
    deleteMedia,
    createWorkOrder,
    linkWorkOrder,
    softDeleteRequest,
  };
}

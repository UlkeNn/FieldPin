import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateCustomer,
  adminSetCustomerActivation,
  adminSoftDeleteCustomer,
  adminUpdateCustomer,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
} from "../../api/customers";

export function useCustomerMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const createCustomer = useMutation({
    mutationFn: (payload: CreateCustomerRequest) => adminCreateCustomer(payload),
    onSuccess: invalidate,
  });

  const updateCustomer = useMutation({
    mutationFn: (args: { id: string; payload: UpdateCustomerRequest }) =>
      adminUpdateCustomer(args.id, args.payload),
    onSuccess: invalidate,
  });

  const setActivation = useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      adminSetCustomerActivation(args.id, args.isActive),
    onSuccess: invalidate,
  });

  const softDeleteCustomer = useMutation({
    mutationFn: (id: string) => adminSoftDeleteCustomer(id),
    onSuccess: invalidate,
  });

  return { createCustomer, updateCustomer, setActivation, softDeleteCustomer };
}
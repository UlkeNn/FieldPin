import { create } from "zustand";
import type { RNFile } from "@/src/features/workorders/api/workorders.api";

// Dinamik string slot key'leri destekler: "veh_s", "dev_0_s", "sen_1_o" vb.
export type CameraSlot = string;

type CameraPayload = {
  slot: CameraSlot;
  files: RNFile[];
} | null;

type CameraReturnState = {
  payload: CameraPayload;
  draftFilesBySlot: Record<string, RNFile[]>;

  setPayload: (payload: CameraPayload) => void;
  clear: () => void;

  setDraftFiles: (slot: string, files: RNFile[]) => void;
  clearDraftFiles: (slot: string) => void;
};

export const useCameraReturnStore = create<CameraReturnState>((set) => ({
  payload: null,
  draftFilesBySlot: {},

  setPayload: (payload) => set({ payload }),
  clear: () => set({ payload: null }),

  setDraftFiles: (slot, files) =>
    set((state) => ({
      draftFilesBySlot: { ...state.draftFilesBySlot, [slot]: files },
    })),

  clearDraftFiles: (slot) =>
    set((state) => ({
      draftFilesBySlot: { ...state.draftFilesBySlot, [slot]: [] },
    })),
}));
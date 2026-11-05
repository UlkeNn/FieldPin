import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {type AddedObject } from "../types/workorder.types";

type WorkOrderDraftState = {
  draftWorkOrderId: string | null;
  objects: AddedObject[];

  setDraftId: (id: string) => void;
  clearDraft: () => void;

  addObjects: (items:AddedObject[]) => void;
  removeObjectAt: (index: number) => void;
};

export const useWorkOrderDraftStore = create<WorkOrderDraftState>()(
  persist(
    (set, get) => ({
      draftWorkOrderId: null,
      objects: [],

      setDraftId: (id) => set({ draftWorkOrderId: id }),
      clearDraft: () => set({ draftWorkOrderId: null, objects: [] }),

      addObjects: (items) => set({ objects: [...get().objects, ...items] }),///neden ...items formatta kullanamadık ??
      removeObjectAt: (index) =>
        set({ objects: get().objects.filter((_, i) => i !== index) }),
    }),
    {
      name: "workorder-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

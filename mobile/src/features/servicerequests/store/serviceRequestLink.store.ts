import { create } from "zustand";
import type { CustomerDto } from "../../customers/api/customers.api";

/**
 * Talep detayından "Yeni İş" formuna prefill devri.
 *
 * useCameraReturnStore ile aynı "yaz → tüket → temizle" idiomu: requests/[id].tsx
 * setPending(...) çağırır, useWorkOrderCreateViewModel odak aldığında consume()
 * ile okur ve aynı anda state'i null'lar. Route param KULLANILMAZ — create.tsx bir
 * tab ekranı ve mount'ta kalıcı olduğu için mount-time bir effect ikinci gidişte
 * tetiklenmez, ayrıca tab route'ta param'lar yapışkan kalıp sonraki manuel "Yeni İş"
 * akışına sessizce sızabilir. Persist EDİLMEZ — oturum içi, tek seferlik bir devir.
 */
export type PendingServiceRequestLink = {
  serviceRequestId: string;
  requestNo: string;
  systemType: number;
  jobType: number;
  customer: CustomerDto | null;
};

type ServiceRequestLinkState = {
  pending: PendingServiceRequestLink | null;
  setPending: (link: PendingServiceRequestLink) => void;
  /** Okur ve aynı anda temizler — iki tüketici aynı payload'ı iki kez almasın. */
  consume: () => PendingServiceRequestLink | null;
  clear: () => void;
};

export const useServiceRequestLinkStore = create<ServiceRequestLinkState>((set, get) => ({
  pending: null,

  setPending: (link) => set({ pending: link }),

  consume: () => {
    const current = get().pending;
    if (current) set({ pending: null });
    return current;
  },

  clear: () => set({ pending: null }),
}));

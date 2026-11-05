import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getActiveCustomers,
  type CustomerDto,
} from "../../customers/api/customers.api";

export type CustomerPickerState = {
  /** Modal açık mı */
  open: boolean;
  /** Arama input değeri */
  search: string;
  /** Seçili kayıtlı müşteri */
  selected: CustomerDto | null;
  /** "Diğer" seçeneği aktif mi */
  isOther: boolean;
  /** Diğer seçilince girilen açıklama metni */
  otherText: string;
};

/**
 * Müşteri seçim modalını ve ilgili state'i yönetir.
 *
 * Kullanım:
 *   const customer = useCustomerPicker();
 *
 *   <TouchableOpacity onPress={customer.openModal} />
 *
 *   <CustomerPickerModal
 *     visible={customer.open}
 *     customers={customer.filtered}
 *     isLoading={customer.isLoading}
 *     search={customer.search}
 *     onSearchChange={customer.setSearch}
 *     onSelect={customer.select}
 *     onCancel={customer.closeModal}
 *   />
 */
export function useCustomerPicker() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerDto | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const query = useQuery({
    queryKey: ["customers-active"],
    queryFn: () => getActiveCustomers(""),
    enabled: open,
    staleTime: 15_000,
  });

  const filtered = useMemo(() => {
    const data = query.data ?? [];
    const s = search.trim().toLowerCase();
    if (!s) return data;

    return data.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const info = (c.info ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      return name.includes(s) || info.includes(s) || phone.includes(s);
    });
  }, [query.data, search]);

  /** CustomerWheel'e gönderilecek seçili id — "OTHER" veya gerçek id */
  const wheelInitialId = isOther ? "OTHER" : (selected?.id ?? null);

  /** Buton / özet satırı için gösterilecek label */
  const label = useMemo(() => {
    if (isOther) {
      return otherText.trim()
        ? `Diğer: ${otherText.trim()}`
        : "Diğer (detay giriniz)";
    }
    return selected?.name ?? "Müşteri seç";
  }, [isOther, selected, otherText]);

  /**
   * CustomerWheel'den id gelince çağrılır.
   * "OTHER" gelirse isOther=true, aksi halde kayıtlı müşteri set edilir.
   */
  function select(id: string) {
    if (id === "OTHER") {
      setSelected(null);
      setIsOther(true);
    } else {
      const picked = (query.data ?? []).find((c) => c.id === id) ?? null;
      setSelected(picked);
      setIsOther(false);
      setOtherText("");
    }
    setOpen(false);
  }

  /**
   * Dışarıdan hazır bir müşteri objesiyle doğrudan seçim yapar — modal açmadan,
   * fetch beklemeden. Talep → Yeni İş prefill akışı için: talep detayı zaten
   * `customer { id, name, phone }` taşıyor, bu CustomerDto'yu karşılıyor.
   * `select(id)` gibi modalı kapatmaz (zaten açık değildir).
   */
  function preselect(c: CustomerDto) {
    setSelected(c);
    setIsOther(false);
    setOtherText("");
  }

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  /** API'ye gönderilecek customerId — Diğer ise null */
  const customerIdForApi = isOther ? null : (selected?.id ?? null);

  /** Form submit öncesi validasyon */
  function validate(): string | null {
    if (!customerIdForApi && !(isOther && otherText.trim().length >= 3)) {
      return "Müşteri seçmelisin (veya Diğer için en az 3 karakter açıklama gir).";
    }
    return null;
  }

  /** Formu sıfırlamak için */
  function reset() {
    setOpen(false);
    setSearch("");
    setSelected(null);
    setIsOther(false);
    setOtherText("");
  }

  return {
    // state
    open,
    search,
    selected,
    isOther,
    otherText,
    label,
    wheelInitialId,

    // query
    filtered,
    isLoading: query.isLoading,

    // computed
    customerIdForApi,

    // actions
    setSearch,
    setOtherText,
    select,
    preselect,
    openModal,
    closeModal,
    validate,
    reset,
  };
}
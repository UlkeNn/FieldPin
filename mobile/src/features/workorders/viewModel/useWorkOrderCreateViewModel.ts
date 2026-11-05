// src/features/workorders/viewModel/useWorkOrderCreateViewModel.ts
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";


import { headerSchema, type HeaderFormValues } from "../validation/workorder.schema";
import { createWorkOrder, createObjectsBatch, uploadObjectMedia } from "../api/workorders.api";
import { JobType, ObjectType, SystemType } from "../types/workorder.enums";
import { WorkOrderObjectRole, type AddedObject } from "../types/workorder.types";

import { useMultiObjectForm, makeCamSlot, type EntryRole, type ObjectKind, type Entry } from "../hooks/useMultiObjectForm";
import { useQrScanner } from "../hooks/useQrScanner";
import { usePlateScanner } from "../hooks/usePlateScanner";
import { useCustomerPicker } from "../hooks/useCustomerPicker";
import { useSlotPhotoViewer } from "../hooks/useSlotPhotoViewer";
import { useWorkOrderLocation } from "../hooks/useWorkOrderLocation";
import { useWorkOrderDraftStore } from "../store/workorderDraft.store";
import { useCameraReturnStore } from "../store/useCameraReturnStore";
import {
  useServiceRequestLinkStore,
  type PendingServiceRequestLink,
} from "../../servicerequests/store/serviceRequestLink.store";
import { errorMessage } from "../../../lib/utils";

// ─── ViewModel ──────────────────────────────────────────────────────────────

export function useWorkOrderCreateViewModel() {
  const queryClient = useQueryClient();


  const headerForm = useForm<HeaderFormValues>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      systemType: SystemType.System1,
      jobType: JobType.Montage,
      customerId: null,
      customerOther: "",
      notes: "",
      faultCause: "",
      faultResolution: "",
    },
    mode: "onChange",
  });

  const systemType: SystemType = headerForm.watch("systemType");
  const jobType: JobType = headerForm.watch("jobType");
  const isReplacement = jobType === JobType.Replace;
  const isFault = jobType === JobType.Fault;

  const multiForm = useMultiObjectForm();
  const customer = useCustomerPicker();
  const location = useWorkOrderLocation();
  const viewer = useSlotPhotoViewer();

  // ─── Tarama → Forma yazma (QR ve Plaka ortak) ───────────────────────────
  // slotKey ("veh_0_s" gibi) çözülüp ilgili nesnenin kimliği güncellenir.
  function applyScan(slotKey: string, value: string) {
    const parts = slotKey.split("_");
    if (parts.length < 3) return;
    const [kindCode, idxStr, roleCode] = parts;

    const kind: ObjectKind = kindCode === "veh" ? "vehicle" : kindCode === "dev" ? "device" : "sensor";
    const idx = Number.parseInt(idxStr, 10);
    const role: EntryRole = roleCode === "o" ? "old" : roleCode === "n" ? "new" : "single";

    multiForm.setId(kind, idx, role, value);
  }

  // ─── QR Scanner (cihaz / sensör / Sistem 2 tanım) ────────────────────────────
  const qr = useQrScanner({ onScanned: applyScan });

  // ─── Plate Scanner (Sistem 1 → Araç plakası) ─────────────────────────────────
  const plate = usePlateScanner({ onScanned: applyScan });

  // ─── Kamera Yönlendirmesi ───────────────────────────────────────────────
  const setDraftFiles = useCameraReturnStore((s) => s.setDraftFiles);

  function openCamera(kind: ObjectKind, index: number, role: EntryRole) {
      const slotKey = makeCamSlot(kind, index, role);
      
      let currentFiles: any[] = [];
      
      if (kind === "vehicle") {
        currentFiles = multiForm.vehicle[role].files;
      } else if (kind === "device") {
        currentFiles = multiForm.devices[index]?.[role]?.files ?? [];
      } else {
        currentFiles = multiForm.sensors[index]?.[role]?.files ?? [];
      }

      setDraftFiles(slotKey, currentFiles);
      router.push({ pathname: "/workorders/camera", params: { slot: slotKey } });
  }
  // ─── Fotoğraf Görüntüleyici ─────────────────────────────────────────────
  function openViewer(kind: ObjectKind, index: number, role: EntryRole, fileIdx: number) {
    const entry = kind === "vehicle"
      ? multiForm.vehicle
      : (kind === "device" ? multiForm.devices[index] : multiForm.sensors[index]);

    if (!entry) return;

    viewer.open(
      entry[role].files,
      fileIdx,
      (i) => multiForm.deleteFile(kind, index, role, i)
    );
  }

  // ─── Draft Yönetimi ─────────────────────────────────────────────────────
  const draftWorkOrderId = useWorkOrderDraftStore((state) => state.draftWorkOrderId);
  const setDraftId = useWorkOrderDraftStore((state) => state.setDraftId);
  const addObjects = useWorkOrderDraftStore((state) => state.addObjects);
  const clearDraft = useWorkOrderDraftStore((state) => state.clearDraft);

  // ─── Talep → İş Emri bağlantısı ─────────────────────────────────────────
  // useServiceRequestLinkStore ile devir: requests/[id].tsx setPending(...) yazar,
  // burada her odak alışında (useFocusEffect) consume() ile tüketilir. Route param
  // KULLANILMAZ — bu tab ekranı mount'ta kalıcı, mount-time bir effect ikinci
  // gidişte tetiklenmezdi; ayrıca tab route'ta param'lar yapışkan kalıp sonraki
  // manuel "Yeni İş" akışına sessizce sızabilirdi.
  const [linkedRequest, setLinkedRequestState] = useState<PendingServiceRequestLink | null>(null);

  function applyPrefill(pending: PendingServiceRequestLink) {
    headerForm.setValue("systemType", pending.systemType as SystemType);
    headerForm.setValue("jobType", pending.jobType as JobType);
    if (pending.customer) {
      customer.preselect(pending.customer);
    }
    setLinkedRequestState(pending);
  }

  function clearLink() {
    setLinkedRequestState(null);
  }

  useFocusEffect(
    useCallback(() => {
      const pending = useServiceRequestLinkStore.getState().consume();
      if (!pending) return;

      // Yarım kalmış (kaydedilmemiş) bir taslak varsa sessizce üzerine yazmayız —
      // talep bağlantısı bu durumda kaybolurdu (submitCurrentForm draftWorkOrderId
      // doluyken createWorkOrder'ı hiç çağırmıyor). Kullanıcıya sor.
      if (draftWorkOrderId) {
        Alert.alert(
          "Devam eden kaydedilmemiş bir iş var",
          `Az önce başladığınız iş bırakılıp "${pending.requestNo}" talebine mi geçilsin?`,
          [
            { text: "Vazgeç", style: "cancel" },
            {
              text: "Talebe geç",
              style: "destructive",
              onPress: () => {
                clearDraft();
                multiForm.resetAll();
                applyPrefill(pending);
              },
            },
          ],
        );
        return;
      }

      applyPrefill(pending);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftWorkOrderId]),
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) => createWorkOrder(payload),
  });

  // ─── Toplama İşlemi (Temizlenmiş Hali) ──────────────────────────────────
  type ItemWithFiles = {
    objectType: ObjectType;
    objectIdentifier: string;
    role: WorkOrderObjectRole;
    notes: null;
    files: any[];
  };

  function collectItems(): ItemWithFiles[] {
    const items: ItemWithFiles[] = [];

    // Her bir entry'yi (vehicle, device, sensor) işleyen yardımcı fonksiyon
    const processEntry = (entry: Entry, type: ObjectType) => {
          const oldId = entry.old.identifier.trim();
          const newId = entry.new.identifier.trim();
          const singleId = entry.single.identifier.trim();

          if (isReplacement) {
            if (oldId) {
              items.push({ objectType: type, objectIdentifier: oldId, role: WorkOrderObjectRole.Old, notes: null, files: entry.old.files });
            }
            if (newId) {
              items.push({ objectType: type, objectIdentifier: newId, role: WorkOrderObjectRole.New, notes: null, files: entry.new.files });
            }
          } else if (singleId) {
            items.push({ objectType: type, objectIdentifier: singleId, role: WorkOrderObjectRole.Single, notes: null, files: entry.single.files });
          }
        };

    // Tüm listeleri tek satırda işle
    processEntry(multiForm.vehicle, ObjectType.Vehicle);
    for (const dev of multiForm.devices) {
      processEntry(dev, ObjectType.Device);
    }

    for (const sen of multiForm.sensors) {
      processEntry(sen, ObjectType.Sensor);
    }

    return items;
  }

  // ─── API Gönderimi (Değişmedi) ──────────────────────────────────────────
  async function submitCurrentForm(): Promise<string | null> {
    const items = collectItems();
    if (items.length === 0) return null;

    let workOrderId = draftWorkOrderId;
    if (!workOrderId) {
      // Submit anında konumu yakala — best-effort.
      // Hook reddedilirse/timeout/hata olursa null döner; payload'a hiçbir konum
      // alanı eklenmez, kayıt yine başarıyla oluşur.
      const capturedLocation = await location.capture();

      const values = headerForm.getValues();
      const notesFinal = customer.isOther
        ? `[Musteri: ${customer.otherText.trim()}] ${values.notes?.trim() ?? ""}`
        : (values.notes?.trim() ?? "");
      const data = await createMutation.mutateAsync({
        systemType: values.systemType,
        jobType: values.jobType,
        customerId: customer.customerIdForApi,
        notes: notesFinal || null,
        faultCause: isFault ? (values.faultCause?.trim() || null) : null,
        faultResolution: isFault ? (values.faultResolution?.trim() || null) : null,
        serviceRequestId: linkedRequest?.serviceRequestId ?? null,
        // capturedLocation null ise spread boş kalır — backend hepsini opsiyonel kabul eder.
        ...(capturedLocation ?? {}),
      });
      workOrderId = (data as any)?.id ?? null;
      if (!workOrderId) throw new Error("Work order olusturma yanitinda id yok.");
      setDraftId(workOrderId);
    }

    const batchPayload = items.map(({ objectType, objectIdentifier, role, notes }) => ({ objectType, objectIdentifier, role, notes }));
    const batchResp = await createObjectsBatch(workOrderId!, batchPayload as any);
    const batchResults: any[] = (batchResp as any)?.data ?? batchResp ?? [];

    const appended: AddedObject[] = [];
    for (let i = 0; i < batchResults.length; i++) {
      const r = batchResults[i] ?? {};
      const role = (r.role ?? items[i]?.role) as WorkOrderObjectRole;
      const objectId = r.id as string;
      if (!objectId) throw new Error("Batch yanitinda object id yok.");
      const files = items[i]?.files ?? [];
      if (files.length) await uploadObjectMedia(objectId, files);
      appended.push({ id: objectId, role, objectType: items[i].objectType, objectIdentifier: items[i].objectIdentifier, files });
    }

    addObjects(appended);
    multiForm.resetAll();
    return workOrderId;
  }

  async function finalize() {
    const customerError = customer.validate();
    if (customerError) { Alert.alert("Hata", customerError); return; }
    
    const items = collectItems();
    const hasNewItems = items.length > 0;
    
    if (!hasNewItems && !draftWorkOrderId) {
      Alert.alert("Hata", "En az bir kimlik girmelisin."); return;
    }
    
    if (hasNewItems && isReplacement) {
      if (!multiForm.vehicle.old.identifier.trim() || !multiForm.vehicle.new.identifier.trim()) {
        Alert.alert("Hata", "Degisim isinde Arac/Tanim icin Eski ve Yeni kimlik zorunlu."); return;
      }
    }
    
    const linkedServiceRequestId = linkedRequest?.serviceRequestId ?? null;

    try {
      if (hasNewItems) await submitCurrentForm();

      // History ekranı açılınca güncel veriyi görsün
      await queryClient.invalidateQueries({ queryKey: ["workorders", "my"] });

      // Talepten bağlantılıysa talep detayı/listesi de bayat kalmasın
      // (workOrderCount / workOrders[] güncellensin).
      if (linkedServiceRequestId) {
        await queryClient.invalidateQueries({
          queryKey: ["service-request", linkedServiceRequestId],
        });
        await queryClient.invalidateQueries({ queryKey: ["service-requests", "my"] });
      }

      Alert.alert("Basarili", "Is kaydedildi.", [
        { text: "Tamam", onPress: () => {
            clearDraft();
            multiForm.resetAll();
            clearLink();
            // systemType, jobType ve müşteri seçimini koru — sadece metin alanlarını yani multiFormu sıfırlıyoruz :):D:):D
            headerForm.setValue("notes", "");
            headerForm.setValue("faultCause", "");
            headerForm.setValue("faultResolution", "");
          } },
      ]);
    } catch (e: any) {
      Alert.alert("Hata", errorMessage(e));
    }
  }

  return {
    headerForm,
    systemType,
    jobType,
    isReplacement,
    isFault,
    multiForm,
    qr,
    plate,
    openCamera,
    openViewer,
    customer,
    location,
    draftWorkOrderId,
    viewer,
    linkedRequest,
    clearLink,
    submitting: createMutation.isPending,
    finalize,
  };
}
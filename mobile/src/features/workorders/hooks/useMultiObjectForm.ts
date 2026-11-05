// src/features/workorders/hooks/useMultiObjectForm.ts

import { useCallback, useEffect, useState } from "react";
import type { RNFile } from "../api/workorders.api";
import { useCameraReturnStore } from "../store/useCameraReturnStore";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type EntryRole = "single" | "old" | "new";
export type ObjectKind = "vehicle" | "device" | "sensor";

export type EntrySlot = {
  identifier: string;
  files: RNFile[];
};

export type Entry = {
  single: EntrySlot;
  old: EntrySlot;
  new: EntrySlot;
};

/** Camera slot key üreteci: "veh_0_s", "dev_1_o", "sen_2_n" */
export function makeCamSlot(kind: ObjectKind, index: number, role: EntryRole): string {
  const k = kind === "vehicle" ? "veh" : kind === "device" ? "dev" : "sen";
  const r = role === "single" ? "s" : role === "old" ? "o" : "n";
  return `${k}_${index}_${r}`;
}

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

function emptySlot(): EntrySlot { return { identifier: "", files: [] }; }
function emptyEntry(): Entry    { return { single: emptySlot(), old: emptySlot(), new: emptySlot() }; }

function patchSlot(e: Entry, role: EntryRole, patch: Partial<EntrySlot>): Entry {
  return { ...e, [role]: { ...e[role], ...patch } };
}

function patchArray(arr: Entry[], i: number, role: EntryRole, patch: Partial<EntrySlot>): Entry[] {
  return arr.map((e, idx) => (idx === i ? patchSlot(e, role, patch) : e));
}

// ─── Ana Hook ─────────────────────────────────────────────────────────────────

export function useMultiObjectForm() {
  const [vehicle, setVehicle] = useState<Entry>(emptyEntry());
  const [devices, setDevices] = useState<Entry[]>([emptyEntry()]);
  const [sensors, setSensors] = useState<Entry[]>([emptyEntry()]);

  // ── Merkezi Nesne Yönetimi (Generic) ──

  const setId = useCallback((kind: ObjectKind, index: number, role: EntryRole, value: string) => {
    if (kind === "vehicle") {
      setVehicle((p) => patchSlot(p, role, { identifier: value }));
    } else if (kind === "device") {
      setDevices((p) => patchArray(p, index, role, { identifier: value }));
    } else {
      setSensors((p) => patchArray(p, index, role, { identifier: value }));
    }
  }, []);

  const setFiles = useCallback((kind: ObjectKind, index: number, role: EntryRole, files: RNFile[]) => {
    if (kind === "vehicle") {
      setVehicle((p) => patchSlot(p, role, { files }));
    } else if (kind === "device") {
      setDevices((p) => patchArray(p, index, role, { files }));
    } else {
      setSensors((p) => patchArray(p, index, role, { files }));
    }
  }, []);

  const deleteFile = useCallback((kind: ObjectKind, index: number, role: EntryRole, fileIdx: number) => {
    const filterFn = (_: any, i: number) => i !== fileIdx;
    
    if (kind === "vehicle") {
      setVehicle((p) => patchSlot(p, role, { files: p[role].files.filter(filterFn) }));
    } else if (kind === "device") {
      setDevices((p) => patchArray(p, index, role, { files: p[index]?.[role].files.filter(filterFn) ?? [] }));
    } else {
      setSensors((p) => patchArray(p, index, role, { files: p[index]?.[role].files.filter(filterFn) ?? [] }));
    }
  }, []);

  // Yeni bir cihaz veya sensör satırı eklemek için
  const addItem = useCallback((kind: Exclude<ObjectKind, "vehicle">) => {
    if (kind === "device") setDevices((p) => [...p, emptyEntry()]);
    else setSensors((p) => [...p, emptyEntry()]);
  }, []);

  // Belirli bir cihaz veya sensör satırını silmek için
  const removeItem = useCallback((kind: Exclude<ObjectKind, "vehicle">, index: number) => {
    if (kind === "device") setDevices((p) => p.filter((_, i) => i !== index));
    else setSensors((p) => p.filter((_, i) => i !== index));
  }, []);

  // ── Kamera Dönüş (Payload) Dinleyicisi ──

  const payload = useCameraReturnStore((s) => s.payload);
  const clearPayload = useCameraReturnStore((s) => s.clear);

  useEffect(() => {
    if (!payload) return;
    const { slot, files } = payload;
    
    const parts = slot.split("_");
    if (parts.length < 3) { 
      clearPayload(); 
      return; 
    }

    const [kCode, idxStr, rCode] = parts;
    const kind: ObjectKind = kCode === "veh" ? "vehicle" : kCode === "dev" ? "device" : "sensor";
    const idx = Number.parseInt(idxStr, 10);
    const role: EntryRole = rCode === "o" ? "old" : rCode === "n" ? "new" : "single";

    // Kameradan gelen dosyaları ilgili nesneye kaydet
    setFiles(kind, idx, role, files);
    
    clearPayload();
  }, [payload, clearPayload, setFiles]);

  // ── Formu Sıfırlama ──
  const resetAll = useCallback(() => {
    setVehicle(emptyEntry());
    setDevices([emptyEntry()]);
    setSensors([emptyEntry()]);
  }, []);

  return {
    // State'ler
    vehicle, 
    devices, 
    sensors,
    
    // Aksiyonlar
    setId, 
    setFiles, 
    deleteFile, 
    addItem,
    removeItem,
    resetAll,
  };
}
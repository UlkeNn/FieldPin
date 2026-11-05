// src/features/workorders/hooks/usePlateScanner.ts
//
// Plaka tarama akışını yöneten hook. useQrScanner ile aynı dış arayüzü paylaşır
// (visible / slotKey / open / close) ve ek olarak tanıma orkestrasyonunu yapar:
//   1) open(slotKey)  → izin iste, modalı aç
//   2) modal kareyi çeker → recognize(file)
//   3) tanınan plaka "detected" olarak gösterilir (kullanıcı onaylar/düzeltir)
//   4) confirm(value)  → onScanned(slotKey, value), modalı kapat

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useCameraPermissions } from "expo-camera";

import { recognizePlate } from "../api/plate.api";
import type { RNFile } from "../api/workorders.api";

export type DetectedPlate = {
  plate: string;
  isValid: boolean;
  confidence: number | null;
};

type UsePlateScannerOptions = {
  onScanned: (slotKey: string, value: string) => void;
};

export function usePlateScanner({ onScanned }: UsePlateScannerOptions) {
  const [permission, requestPermission] = useCameraPermissions();
  const [visible, setVisible] = useState(false);
  const [slotKey, setSlotKey] = useState<string>("veh_0_s");

  const [busy, setBusy] = useState(false);
  const [detected, setDetected] = useState<DetectedPlate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setBusy(false);
    setDetected(null);
    setError(null);
  }, []);

  const open = useCallback(
    async (key: string) => {
      setSlotKey(key);
      reset();

      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert("İzin Gerekli", "Plaka okumak için kamera iznini vermelisin.");
          return;
        }
      }

      setVisible(true);
    },
    [permission?.granted, requestPermission, reset],
  );

  const close = useCallback(() => {
    setVisible(false);
    reset();
  }, [reset]);

  /** Çekilen kareyi tanıma servisine gönderir. */
  const recognize = useCallback(async (file: RNFile) => {
    setBusy(true);
    setError(null);
    setDetected(null);
    try {
      const res = await recognizePlate(file);
      setDetected({ plate: res.plate, isValid: res.isValid, confidence: res.confidence });
    } catch (e: any) {
      setError(e?.message ?? "Plaka tanınamadı.");
    } finally {
      setBusy(false);
    }
  }, []);

  /** Onaylanan (gerekirse elle düzeltilen) plakayı forma yazar. */
  const confirm = useCallback(
    (value: string) => {
      const v = (value ?? "").trim();
      if (!v) return;
      onScanned(slotKey, v);
      setVisible(false);
      reset();
    },
    [onScanned, slotKey, reset],
  );

  return {
    // Durum
    visible,
    slotKey,
    busy,
    detected,
    error,
    cameraActive: visible,
    // Aksiyonlar
    open,
    close,
    recognize,
    confirm,
    reset,
  };
}

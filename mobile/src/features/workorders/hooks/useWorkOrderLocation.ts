import { useCallback, useState } from "react";
import * as Location from "expo-location";

import { LocationSource } from "../types/workorder.enums";
import type { WorkOrderLocationFields } from "../api/workorders.api";

// ─── Sabitler ─────────────────────────────────────────────────────────────

/**
 * Bunun altındaki accuracy değerleri "GPS fix" sayılır; üstü Network olarak
 * etiketlenir. expo-location bize provider'ı doğrudan söylemediği için
 * doğruluk heuristic'i kullanıyoruz.
 */
const GPS_ACCURACY_THRESHOLD_METERS = 30;

/**
 * getCurrentPositionAsync hang olabilir; bu süre sonunda last known fix
 * fallback'ine geçeriz. Indoor iOS'ta GPS lock 20sn'yi bulabildiği için
 * cömert tutuyoruz.
 */
const CAPTURE_TIMEOUT_MS = 30_000;

// ─── Tipler ───────────────────────────────────────────────────────────────

export type LocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "denied"
  | "error";

// ─── Yardımcı ────────────────────────────────────────────────────────────

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * WorkOrder kayıt akışı için konum (lat/lng + accuracy + capturedAt + source) yönetir.
 *
 * Strateji:
 *   1. Foreground izin iste
 *   2. Last known fix varsa hemen kullan (instant)
 *   3. Yoksa Balanced accuracy ile fresh fix (~5-10sn indoor)
 *   4. 30sn timeout
 *
 * Kullanım:
 *   const location = useWorkOrderLocation();
 *   const captured = await location.capture(); // null veya WorkOrderLocationFields
 */
export function useWorkOrderLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [value, setValue] = useState<WorkOrderLocationFields | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const capture = useCallback(async (): Promise<WorkOrderLocationFields | null> => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      // 1) Foreground izin
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus("denied");
        return null;
      }

      // 2) ÖNCE last known fix'e bak — varsa anında dön
      let position: Location.LocationObject | null = null;
      try {
        position = await Location.getLastKnownPositionAsync();
      } catch {
        // last known çağrısı kendi başına hata verirse görmezden gel,
        // fresh fix denemesine düş
        position = null;
      }

      // 3) Last known yoksa fresh fix iste (Balanced ~50m, hızlı)
      if (!position) {
        try {
          position = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            CAPTURE_TIMEOUT_MS,
            "Konum okuma zaman aşımına uğradı",
          );
        } catch {
          setErrorMessage(
            "Konum alınamadı. Konum servislerinin açık olduğundan emin ol.",
          );
          setStatus("error");
          return null;
        }
      }

      if (!position) {
        setErrorMessage("Konum bulunamadı.");
        setStatus("error");
        return null;
      }

      // 4) Source tespiti — accuracy değerine göre
      const accuracy = position.coords.accuracy;
      const source =
        accuracy != null && accuracy <= GPS_ACCURACY_THRESHOLD_METERS
          ? LocationSource.Gps
          : LocationSource.Network;

      const captured: WorkOrderLocationFields = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationAccuracy: accuracy ?? null,
        locationCapturedAt: new Date(position.timestamp).toISOString(),
        locationSource: source,
      };

      setValue(captured);
      setStatus("ready");
      return captured;
    } catch (e: any) {
      setErrorMessage(e?.message ?? "Konum alınamadı");
      setStatus("error");
      return null;
    }
  }, []);

  const setManual = useCallback((latitude: number, longitude: number): boolean => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;

    setValue({
      latitude,
      longitude,
      locationAccuracy: null,
      locationCapturedAt: new Date().toISOString(),
      locationSource: LocationSource.Manual,
    });
    setStatus("ready");
    setErrorMessage(null);
    return true;
  }, []);

  const reset = useCallback(() => {
    setValue(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const clear = reset;

  return {
    status,
    value,
    errorMessage,
    hasLocation: value !== null && value.latitude != null && value.longitude != null,
    isLoading: status === "loading",
    isDenied: status === "denied",
    isReady: status === "ready",
    capture,
    setManual,
    reset,
    clear,
  } as const;
}

export type UseWorkOrderLocationReturn = ReturnType<typeof useWorkOrderLocation>;
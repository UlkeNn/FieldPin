import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useCameraPermissions } from "expo-camera";

function extractDeviceId(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.deviceId === "string") return parsed.deviceId;
    if (typeof parsed?.id === "string") return parsed.id;
  } catch {}
  return String(raw ?? "").replace(/^device:/i, "").trim();
}

type UseQrScannerOptions = {
  onScanned: (slotKey: string, value: string) => void;
};

export function useQrScanner({ onScanned }: UseQrScannerOptions) {
  const [permission, requestPermission] = useCameraPermissions();
  const [visible, setVisible] = useState(false);
  const [slotKey, setSlotKey] = useState<string>("veh_0_s");
  const scannedRef = useRef(false);

  async function open(key: string) {
    setSlotKey(key);

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("İzin Gerekli", "QR okumak için kamera iznini vermelisin.");
        return;
      }
    }

    scannedRef.current = false;
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function handleScan(raw: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setVisible(false);
    const value = extractDeviceId(raw);
    if (!value) return;
    onScanned(slotKey, value);
  }

  return {
    visible,
    slotKey,
    open,
    close,
    handleScan,
    cameraActive: visible,
  };
}

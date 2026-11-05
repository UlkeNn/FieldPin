// src/features/settings/hooks/useCameraPermission.ts
import { Alert, Linking } from "react-native";
import { useCameraPermissions } from "expo-camera";

/**
 * Kamera iznini sorgular ve istenmesini sağlar.
 * Daha önce reddedilmiş ve canAskAgain=false ise kullanıcıyı sistem ayarlarına yönlendirir.
 *
 * Kullanım:
 *   const camera = useCameraPermission();
 *   camera.status   // "granted" | "denied" | "undetermined" | "loading"
 *   camera.request() // izin akışını başlatır
 */
export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();

  const status: string = permission?.status ?? "loading";

  async function request() {
    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        "İzin Gerekli",
        "Kamera iznini sistem ayarlarından açmanız gerekiyor.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Ayarlara Git", onPress: () => Linking.openSettings() },
        ]
      );
    }
  }

  return { status, request };
}

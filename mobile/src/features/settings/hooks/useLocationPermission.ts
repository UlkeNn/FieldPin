// src/features/settings/hooks/useLocationPermission.ts
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";

type Status = "granted" | "denied" | "undetermined" | "loading";

/**
 * Konum (foreground) iznini sorgular ve istenmesini sağlar.
 * Mount olunca mevcut izin durumunu otomatik okur.
 *
 * Kullanım:
 *   const location = useLocationPermission();
 *   location.status   // "granted" | "denied" | "undetermined" | "loading"
 *   location.request()
 */
export function useLocationPermission() {
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    const res = await Location.getForegroundPermissionsAsync();
    setStatus(res.status as Status);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function request() {
    const res = await Location.requestForegroundPermissionsAsync();

    if (res.status !== "granted" && !res.canAskAgain) {
      Alert.alert(
        "İzin Gerekli",
        "Konum iznini sistem ayarlarından açmanız gerekiyor.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Ayarlara Git", onPress: () => Linking.openSettings() },
        ]
      );
    }

    setStatus(res.status as Status);
  }

  return { status, request, refresh };
}

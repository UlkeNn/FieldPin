// src/features/settings/viewModel/useSettingsViewModel.ts
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { useMe } from "@/src/features/auth/hooks/useMe";
import { useLogoutConfirm } from "@/src/features/auth/hooks/useLogoutConfirm";
import { useUpdateAvatar } from "@/src/features/auth/hooks/useUpdateAvatar";
import type { AvatarUploadFile } from "@/src/features/auth/api/avatar.api";

import { useCameraPermission } from "../hooks/useCameraPermission";
import { useLocationPermission } from "../hooks/useLocationPermission";

/**
 * Settings ekranının tüm state ve action'larını birleştirir.
 * UI sadece bu hook'u tüketir; başka hiçbir hook'a/api'ye erişmez.
 */
export function useSettingsViewModel() {
  const me = useMe();
  const camera = useCameraPermission();
  const location = useLocationPermission();
  const { confirmLogout } = useLogoutConfirm();
  const avatar = useUpdateAvatar();

  // ── Avatar akışı ──────────────────────────────────────────

  /** Galeriden seç → 512px'e küçült → JPEG'e çevir → yükle */
  async function pickAndUploadAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("İzin gerekli", "Galeri izni verilmedi.");
        return;
      }

      // Expo SDK 50+ ve eski sürüm uyumluluğu (camera.tsx ile aynı pattern)
      const mediaTypesCompat =
        (ImagePicker as any).MediaType?.Images
          ? ([(ImagePicker as any).MediaType.Images] as any)
          : (ImagePicker as any).MediaTypeOptions?.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesCompat as any,
        allowsMultipleSelection: false,
        quality: 1, // resize'ı manipulator'da yapacağız
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      // 512px genişliğe orantılı küçült + JPEG %80
      // (kare crop YAPMIYORUZ; UI dairesel olarak gösterecek zaten)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const file: AvatarUploadFile = {
        uri: manipulated.uri,
        name: `avatar_${Date.now()}.jpg`,
        type: "image/jpeg",
      };

      await avatar.upload.mutateAsync(file);
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Avatar yüklenemedi");
    }
  }

  /** Mevcut fotoğrafı silme onayı + delete çağrısı */
  function confirmDeleteAvatar() {
    Alert.alert(
      "Profil Fotoğrafı",
      "Mevcut fotoğrafı silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await avatar.remove.mutateAsync();
            } catch (e: any) {
              Alert.alert("Hata", e?.message ?? "Silinemedi");
            }
          },
        },
      ]
    );
  }

  /**
   * Profil fotoğrafına basınca açılan menü (ActionSheet rolü).
   * Avatar yoksa "Sil" seçeneğini gizliyoruz.
   */
  function openAvatarMenu() {
    const hasAvatar = !!me.data?.avatarUrl;

    type AlertButton = {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    };

    const buttons: AlertButton[] = [
      { text: "Galeriden Seç", onPress: pickAndUploadAvatar },
    ];

    if (hasAvatar) {
      buttons.push({
        text: "Fotoğrafı Sil",
        style: "destructive",
        onPress: confirmDeleteAvatar,
      });
    }

    buttons.push({ text: "İptal", style: "cancel" });

    Alert.alert("Profil Fotoğrafı", "Ne yapmak istersiniz?", buttons);
  }

  return {
    profile: {
      username: me.data?.username,
      avatarUrl: me.data?.avatarUrl,
      isLoading: me.isLoading,
      isUploading: avatar.upload.isPending || avatar.remove.isPending,
      onPress: openAvatarMenu,
    },
    permissions: {
      camera,
      location,
    },
    logout: confirmLogout,
  };
}

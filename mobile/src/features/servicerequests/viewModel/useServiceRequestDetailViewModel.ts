// src/features/servicerequests/viewModel/useServiceRequestDetailViewModel.ts
import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import {
  changeServiceRequestStatus,
  getServiceRequestById,
  uploadServiceRequestMedia,
} from "../api/servicerequests.api";
import { RequestStatus } from "../types/servicerequest.enums";
import type { RNFile } from "../../workorders/api/workorders.api";
import { errorMessage } from "../../../lib/utils";

// ─── İzin verilen durum geçişleri (TEKNİSYEN) ───────────────────────────
// DİKKAT: admin tablosuyla karıştırma — admin'in izinleri çok daha geniş.
// Kaynak: service-requests.md §2 "PATCH /api/service-requests/{id}/status"
const TECHNICIAN_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  [RequestStatus.Assigned]: [RequestStatus.InProgress],
  [RequestStatus.InProgress]: [RequestStatus.OnHold, RequestStatus.Completed],
  [RequestStatus.OnHold]: [RequestStatus.InProgress],
};

export function allowedTargets(status: number): RequestStatus[] {
  return TECHNICIAN_TRANSITIONS[status as RequestStatus] ?? [];
}

export function isTerminal(status: number): boolean {
  return status === RequestStatus.Completed || status === RequestStatus.Cancelled;
}

export function requiresResolutionNote(target: number): boolean {
  return target === RequestStatus.Completed;
}

// ─── Fotoğraf yardımcıları ───────────────────────────────────────────────
// useSettingsViewModel.pickAndUploadAvatar deseni: galeriden/kameradan seç →
// 1600px genişliğe küçült → JPEG %80. 50MB istek limitine takılmayı ve HEIC
// belirsizliğini önler. app/workorders/camera.tsx'teki slot/QR/plaka makinesine
// dokunulmaz — burası düz, nesnesiz bir liste.

function mediaTypesImagesCompat(): any {
  return (ImagePicker as any).MediaType?.Images
    ? [(ImagePicker as any).MediaType.Images]
    : (ImagePicker as any).MediaTypeOptions?.Images;
}

async function manipulateToFile(uri: string, index: number): Promise<RNFile> {
  const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: manipulated.uri,
    name: `request_${Date.now()}_${index}.jpg`,
    type: "image/jpeg",
  };
}

async function pickFromGallery(): Promise<RNFile[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("İzin gerekli", "Galeri izni verilmedi.");
    return [];
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypesImagesCompat(),
    allowsMultipleSelection: true,
    quality: 1, // küçültmeyi manipulator yapacak
  });

  if (res.canceled) return [];

  const files: RNFile[] = [];
  for (let i = 0; i < res.assets.length; i++) {
    files.push(await manipulateToFile(res.assets[i].uri, i));
  }
  return files;
}

async function takePhoto(): Promise<RNFile[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("İzin gerekli", "Kamera izni verilmedi.");
    return [];
  }

  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: mediaTypesImagesCompat(),
    quality: 1,
  });

  if (res.canceled || !res.assets?.[0]) return [];

  return [await manipulateToFile(res.assets[0].uri, 0)];
}

// ─── ViewModel ────────────────────────────────────────────────────────────

export function useServiceRequestDetailViewModel(id: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["service-request", id],
    queryFn: () => getServiceRequestById(id!),
    enabled: !!id,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["service-requests", "my"] });
    queryClient.invalidateQueries({ queryKey: ["service-request", id] });
  }

  const statusMutation = useMutation({
    mutationFn: (payload: { status: number; resolutionNote?: string | null }) =>
      changeServiceRequestStatus(id!, payload),
    onSuccess: invalidateAll,
  });

  const mediaMutation = useMutation({
    mutationFn: (files: RNFile[]) => uploadServiceRequestMedia(id!, files),
    onSuccess: invalidateAll,
  });

  async function changeStatus(target: number, resolutionNote: string | null) {
    if (requiresResolutionNote(target) && !resolutionNote?.trim()) {
      Alert.alert("Hata", "Talebi tamamlarken çözüm notu zorunludur.");
      return;
    }
    try {
      await statusMutation.mutateAsync({ status: target, resolutionNote });
    } catch (e: any) {
      Alert.alert("Hata", errorMessage(e));
    }
  }

  async function uploadFiles(files: RNFile[]) {
    if (!files.length) return;
    try {
      await mediaMutation.mutateAsync(files);
    } catch (e: any) {
      Alert.alert("Hata", errorMessage(e));
    }
  }

  /** Galeri/Kamera seçim menüsü — useSettingsViewModel.openAvatarMenu deseni. */
  function openAddMediaMenu() {
    Alert.alert("Fotoğraf Ekle", "Ne yapmak istersiniz?", [
      {
        text: "Galeriden Seç",
        onPress: async () => uploadFiles(await pickFromGallery()),
      },
      {
        text: "Kamera ile Çek",
        onPress: async () => uploadFiles(await takePhoto()),
      },
      { text: "İptal", style: "cancel" },
    ]);
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    changeStatus,
    isChangingStatus: statusMutation.isPending,

    openAddMediaMenu,
    isUploadingMedia: mediaMutation.isPending,
  };
}

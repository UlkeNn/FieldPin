import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useCameraReturnStore,
  type CameraSlot,
} from "@/src/features/workorders/store/useCameraReturnStore";
import type { RNFile } from "@/src/features/workorders/api/workorders.api";
import { COLORS } from "@/src/lib/theme";

type CameraHandle = {
  takePictureAsync: (options?: {
    quality?: number;
    skipProcessing?: boolean;
  }) => Promise<{ uri: string }>;
};

function mergeFiles(prev: RNFile[], next: RNFile[]) {
  const map = new Map<string, RNFile>();

  for (const file of [...prev, ...next]) {
    const key = `${file.uri}__${file.name}`;
    if (!map.has(key)) map.set(key, file);
  }

  return Array.from(map.values());
}

function buildCapturedFile(uri: string): RNFile {
  const safeTs = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    uri,
    name: `capture_${safeTs}.jpg`,
    type: "image/jpeg",
  };
}

export default function CameraStubPage() {
  const params = useLocalSearchParams<{ slot?: string }>();
  const  slot = (params.slot as CameraSlot) ?? "single";

  const [files, setFiles] = useState<RNFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef<CameraHandle | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const setPayload = useCameraReturnStore((s) => s.setPayload);
  const draftFilesBySlot = useCameraReturnStore((s) => s.draftFilesBySlot);

  useEffect(() => {
    setFiles(draftFilesBySlot[slot] ?? []);
  }, [slot, draftFilesBySlot]);

  useEffect(() => {
    if (!cameraPermission) return;
    if (cameraPermission.granted) return;
    if (cameraPermission.canAskAgain === false) return;

    requestCameraPermission();
  }, [cameraPermission, requestCameraPermission]);

  const previewFile = files[previewIndex] ?? null;

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("İzin gerekli", "Galeri izni verilmedi.");
        return;
      }

      const mediaTypesCompat =
        (ImagePicker as any).MediaType?.Images
          ? ([(ImagePicker as any).MediaType.Images] as any)
          : (ImagePicker as any).MediaTypeOptions?.Images;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesCompat as any,
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (res.canceled) return;

      const mapped: RNFile[] = res.assets.map((a, index) => ({
        uri: a.uri,
        name: (a.fileName ?? `gallery_${Date.now()}_${index}.jpg`).toString(),
        type: a.mimeType ?? "image/jpeg",
      }));

      setFiles((prev) => mergeFiles(prev, mapped));
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Galeri açılamadı");
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const perm = await requestCameraPermission();
      if (!perm.granted) {
        Alert.alert("İzin gerekli", "Kamera izni verilmedi.");
        return;
      }
    }

    if (!cameraReady) {
      Alert.alert("Hazırlanıyor", "Kamera henüz hazır değil.");
      return;
    }

    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        Alert.alert("Hata", "Fotoğraf çekilemedi.");
        return;
      }

      const file = buildCapturedFile(photo.uri);
      setFiles((prev) => [...prev, file]);
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Fotoğraf çekilemedi.");
    } finally {
      setCapturing(false);
    }
  };


  //burası kamera izni reddedildiğinde kullanıcıyı ayarlara yönlendirmek için kullanacağız
  const promptOpenSettings = () => {
    Alert.alert(
      "Kamera izni gerekli",
      "Kamera iznini cihaz ayarlarından açman gerekiyor.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Ayarları Aç", onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleRequestCameraPermission = async () => {
    if (!cameraPermission) return;          // durum henüz yüklenmedi
    if (cameraPermission.granted) return;   // zaten izinli

    // Hâlâ sorulabiliyorsa sistem dialogunu aç
    if (cameraPermission.canAskAgain) {
      const res = await requestCameraPermission();
      // Kullanıcı bu sefer "bir daha sorma" dediyse ayarlara yönlendir
      if (!res.granted && !res.canAskAgain) {
        promptOpenSettings();
      }
      return;
    }

  // Kalıcı reddedilmiş → ayarlara yönlendir
  promptOpenSettings();
};




  const askDeletePhoto = (index: number) => {
    Alert.alert("Fotoğrafı sil", "Fotoğrafı silmek istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          setFiles((prev) => {
            const next = prev.filter((_, i) => i !== index);

            if (!next.length) {
              setPreviewVisible(false);
              setPreviewIndex(0);
            } else if (previewIndex >= next.length) {
              setPreviewIndex(next.length - 1);
            }

            return next;
          });
        },
      },
    ]);
  };

  const saveAndReturn = () => {
    setPayload({ slot, files });
    if (router.canGoBack?.()) router.back();
    else router.replace("/create");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F6FA" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>
        <Text style={{ fontSize: 20, fontWeight: "900" }}>Fotoğraflar</Text>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E4E7EC",
          }}
        >
          <View style={{ height: 340, backgroundColor: "black" }}>
            {cameraPermission?.granted ? (
              <CameraView
                ref={cameraRef as any}
                style={{ flex: 1 }}
                facing="back"
                active
                onCameraReady={() => setCameraReady(true)}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  gap: 12,
                }}
              >
                <FontAwesome name="camera" size={34} color="white" />
                <Text style={{ color: "white", textAlign: "center" }}>
                  Kamera izni gerekiyor.
                </Text>

                <TouchableOpacity
                  onPress={handleRequestCameraPermission}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.92)",
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>İzin Ver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ padding: 12, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={pickFromGallery}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.yellowCamera,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>Galeriden Seç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePhoto}
                disabled={!cameraPermission?.granted || !cameraReady || capturing}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.blueCamera,
                  opacity: !cameraPermission?.granted || !cameraReady || capturing ? 0.6 : 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>
                  {capturing ? "Çekiliyor..." : "Fotoğraf Çek"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setFiles([])}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#F3F4F6", fontWeight: "900" }}>Temizle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveAndReturn}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.greenCamera,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>Kaydet ve Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 12,
            gap: 10,
          }}
        >
          <Text style={{ fontWeight: "900", fontSize: 16 }}>
            Seçilen / Çekilen Fotoğraflar ({files.length})
          </Text>

          {!files.length ? (
            <Text style={{ color: "#98A2B3" }}>Henüz fotoğraf eklenmedi.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {files.map((f, i) => (
                  <TouchableOpacity
                    key={`${f.uri}-${i}`}
                    onPress={() => {
                      setPreviewIndex(i);
                      setPreviewVisible(true);
                    }}
                    style={{ borderRadius: 12, overflow: "hidden" }}
                  >
                    <Image
                      source={{ uri: f.uri }}
                      style={{
                        width: 82,
                        height: 82,
                        borderRadius: 12,
                        backgroundColor: "#eee",
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={previewVisible}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {previewFile ? (
              <Image
                source={{ uri: previewFile.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : null}
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 24,
              backgroundColor: "rgba(0,0,0,0.85)",
              gap: 12,
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {files.map((file, index) => {
                  const isSelected = index === previewIndex;

                  return (
                    <TouchableOpacity
                      key={`${file.uri}-${index}`}
                      onPress={() => setPreviewIndex(index)}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 12,
                        overflow: "hidden",
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: "white",
                      }}
                    >
                      <Image
                        source={{ uri: file.uri }}
                        style={{ width: "100%", height: "100%" }}
                      />

                      {isSelected ? (
                        <TouchableOpacity
                          onPress={() => askDeletePhoto(index)}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FontAwesome name="trash-o" size={15} color="white" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900" }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
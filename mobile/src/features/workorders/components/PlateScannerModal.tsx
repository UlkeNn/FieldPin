// src/features/workorders/components/PlateScannerModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView } from "expo-camera";
import { FontAwesome } from "@expo/vector-icons";

import { COLORS } from "../../../lib/theme";
import type { RNFile } from "../api/workorders.api";
import type { DetectedPlate } from "../hooks/usePlateScanner";

type CameraHandle = {
  takePictureAsync: (options?: {
    quality?: number;
    skipProcessing?: boolean;
  }) => Promise<{ uri: string }>;
};

type Props = {
  visible: boolean;
  busy: boolean;
  detected: DetectedPlate | null;
  error: string | null;
  onClose: () => void;
  onCapture: (file: RNFile) => void;
  onConfirm: (value: string) => void;
  onRetry: () => void;
};

function buildFile(uri: string): RNFile {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return { uri, name: `plate_${ts}.jpg`, type: "image/jpeg" };
}

export function PlateScannerModal({
  visible,
  busy,
  detected,
  error,
  onClose,
  onCapture,
  onConfirm,
  onRetry,
}: Props) {
  const cameraRef = useRef<CameraHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Yeni bir plaka tanındığında düzenleme alanını doldur.
  useEffect(() => {
    if (detected) setEditValue(detected.plate);
  }, [detected]);

  // Modal her kapanışta yerel durumları sıfırla.
  useEffect(() => {
    if (!visible) {
      setReady(false);
      setCapturing(false);
      setEditValue("");
    }
  }, [visible]);

  const takeAndRecognize = async () => {
    if (!cameraRef.current || capturing || !ready) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) onCapture(buildFile(photo.uri));
    } finally {
      setCapturing(false);
    }
  };

  const showConfirm = !!detected; // tanıma tamamlandı → onay paneli
  const showError = !detected && !!error;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <CameraView
          ref={cameraRef as any}
          style={{ flex: 1 }}
          facing="back"
          active={visible}
          onCameraReady={() => setReady(true)}
        />

        {/* Plaka kılavuz çerçevesi */}
        {!showConfirm && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: "78%",
                aspectRatio: 4.5, // tipik plaka oranına yakın
                borderWidth: 3,
                borderColor: "rgba(255,255,255,0.9)",
                borderRadius: 12,
                backgroundColor: "rgba(0,0,0,0.05)",
              }}
            />
            <Text style={{ marginTop: 14, color: "white", fontWeight: "700" }}>
              Plakayı çerçeveye hizala ve “Tara”ya bas
            </Text>
          </View>
        )}

        {/* Üst kapat butonu */}
        <View style={{ position: "absolute", top: 50, left: 16, right: 16 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Text style={{ textAlign: "center", fontWeight: "900" }}>Kapat</Text>
          </TouchableOpacity>
        </View>

        {/* Tanıma sürüyor katmanı */}
        {busy && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <ActivityIndicator size="large" color="white" />
            <Text style={{ marginTop: 12, color: "white", fontWeight: "700" }}>
              Plaka tanınıyor...
            </Text>
          </View>
        )}

        {/* Alt panel: tara / onay / hata */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: 16,
            paddingBottom: 28,
            gap: 12,
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          {showConfirm ? (
            <>
              <Text style={{ color: "white", fontWeight: "700" }}>
                Tanınan Plaka
                {detected?.confidence != null
                  ? `  (%${Math.round(detected.confidence * 100)} güven)`
                  : ""}
              </Text>

              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                autoCapitalize="characters"
                placeholder="34 ABC 123"
                placeholderTextColor="#98A2B3"
                style={{
                  backgroundColor: "white",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 20,
                  fontWeight: "900",
                  letterSpacing: 1,
                  textAlign: "center",
                }}
              />

              {detected && !detected.isValid && (
                <Text style={{ color: "#FECC00", fontSize: 12, textAlign: "center" }}>
                  Plaka biçimi tanıdık değil — lütfen kontrol edip düzeltin.
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={onRetry}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.92)",
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>Tekrar Dene</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onConfirm(editValue)}
                  disabled={!editValue.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: COLORS.greenCamera,
                    opacity: editValue.trim() ? 1 : 0.6,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>Onayla</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : showError ? (
            <>
              <Text style={{ color: "#FECACA", textAlign: "center", fontWeight: "700" }}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={onRetry}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.92)",
                }}
              >
                <Text style={{ fontWeight: "900" }}>Tekrar Dene</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={takeAndRecognize}
              disabled={!ready || capturing || busy}
              style={{
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                backgroundColor: COLORS.primary,
                opacity: !ready || capturing || busy ? 0.6 : 1,
              }}
            >
              <FontAwesome name="car" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                {capturing ? "Çekiliyor..." : "Tara"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

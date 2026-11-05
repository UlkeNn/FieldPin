import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import type { RNFile } from "../api/workorders.api";
import { PhotoPreviewSection } from "./PhotoPreviewSection";
import { COLORS, INPUT_STYLE } from "../../../lib/theme";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onCamera: () => void;
  onQr: () => void;
  files: RNFile[];
  onPreview: (index: number) => void;
  /** Tarama tipi: "qr" → QR okuyucu, "plate" → plaka tanıma. Varsayılan "qr". */
  scanType?: "qr" | "plate";
  /** Plaka tanıma akışını açar (scanType === "plate" iken kullanılır). */
  onPlate?: () => void;
};

export function IdentifierInput({
  label,
  value,
  onChange,
  placeholder,
  onCamera,
  onQr,
  files,
  onPreview,
  scanType = "qr",
  onPlate,
}: Props) {
  const isPlate = scanType === "plate";
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          autoCapitalize="none"
          style={{ flex: 1, ...INPUT_STYLE }}
        />

        <TouchableOpacity
          onPress={onCamera}
          style={{
            width: 44, height: 44, borderRadius: 10,
            backgroundColor: "#EEF3FB",
            alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <FontAwesome name="camera" size={18} color="#111" />
          {files.length > 0 && (
            <View style={{
              position: "absolute", top: 5, right: 5,
              minWidth: 16, height: 16, borderRadius: 8,
              backgroundColor: COLORS.primary,
              alignItems: "center", justifyContent: "center",
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 10 }}>
                {files.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isPlate ? onPlate : onQr}
          accessibilityLabel={isPlate ? "Plaka tara" : "QR tara"}
          style={{
            width: 44, height: 44, borderRadius: 10,
            backgroundColor: "#EEF3FB",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <FontAwesome name={isPlate ? "car" : "qrcode"} size={18} color="#111" />
        </TouchableOpacity>
      </View>

      {files.length > 0 && (
        <PhotoPreviewSection files={files} onPreview={onPreview} />
      )}
    </View>
  );
}

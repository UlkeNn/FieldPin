import { TextInput, TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { INPUT_STYLE } from "../../../lib/theme";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onCamera: () => void;
  onQr: () => void;
  photoCount: number;
};

export function IdentifierRow({ value, onChange, placeholder, onCamera, onQr, photoCount }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        autoCapitalize="none"
        style={{
          flex: 1,
          ...INPUT_STYLE,
        }}
      />

      <TouchableOpacity
        onPress={onCamera}
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          backgroundColor: "#EEF3FB",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <FontAwesome name="camera" size={20} color="#111" />
        {photoCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#111",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5,
            }}
          >
            <Text style={{ color: "white", fontWeight: "900", fontSize: 11 }}>
              {photoCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onQr}
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          backgroundColor: "#EEF3FB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome name="qrcode" size={20} color="#111" />
      </TouchableOpacity>
    </View>
  );
}
// src/features/settings/components/PermissionRow.tsx
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  status: string;          // "granted" | "denied" | "undetermined" | "loading"
  onPress: () => void;
  /** Bir sonraki PermissionRow varsa altına ince çizgi koy */
  showDivider?: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  granted: "İZİNLİ",
  denied: "REDDEDİLDİ",
  undetermined: "SORULMADI",
  loading: "YÜKLENİYOR",
};

function colorOf(status: string): string {
  if (status === "granted") return "#4CAF50";
  if (status === "denied") return "#FF9800";
  return "#9E9E9E";
}

export function PermissionRow({
  icon,
  label,
  status,
  onPress,
  showDivider = false,
}: Props) {
  const color = colorOf(status);
  const text = STATUS_LABEL[status] ?? status.toUpperCase();

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          gap: 10,
        }}
      >
        <Ionicons name={icon} size={20} color="#555" />
        <Text style={{ flex: 1, fontSize: 15, color: "#222" }}>{label}</Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color,
            marginRight: 4,
          }}
        >
          {text}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      {showDivider && (
        <View
          style={{ height: 1, backgroundColor: "#f0f0f0", marginLeft: 44 }}
        />
      )}
    </>
  );
}

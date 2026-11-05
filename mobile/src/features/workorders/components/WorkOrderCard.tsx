import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/src/lib/theme";
import { Badge } from "./Badge";
import type { WorkOrderDto } from "../api/workorders.api";
import {
  formatDateTime,
  jobTypeLabel,
  systemTypeLabel,
  systemIcon,
  jobBadgeColor,
} from "../utils/labels";

type Props = {
  item: WorkOrderDto;
};

export function WorkOrderCard({ item }: Props) {
  const objectCount = item.objects?.length ?? 0;
  const truncatedNote =
    item.notes && item.notes.length > 80
      ? item.notes.slice(0, 80) + "…"
      : item.notes;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: "/workorders/[id]", params: { id: item.id } })
      }
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        gap: 8,
      }}
    >
      {/* Üst satır: sistem badge + tarih */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name={systemIcon(item.systemType) as any}
            size={20}
            color={COLORS.blue}
          />
          <Text style={{ fontWeight: "800", fontSize: 15, color: COLORS.blue }}>
            {systemTypeLabel(item.systemType)}
          </Text>
        </View>

        <Text style={{ fontSize: 13, color: "#667085" }}>
          {formatDateTime(item.createdAt)}
        </Text>
      </View>

      {/* İş tipi badge */}
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Badge label={jobTypeLabel(item.jobType)} color={jobBadgeColor(item.jobType)} />
      </View>

      {/* Müşteri */}
      <Text style={{ fontSize: 15 }}>
        <Text style={{ fontWeight: "700" }}>Müşteri: </Text>
        {item.customer?.name ?? "—"}
      </Text>

      {/* Konum rozeti (varsa) — kullanıcı detaya girince koordinatları
          ve "Haritada Aç" seçeneğini görür. Liste'de sadece "var/yok" göster. */}
      {item.latitude != null && item.longitude != null ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            alignSelf: "flex-start",
            paddingVertical: 3,
            paddingHorizontal: 8,
            backgroundColor: "#EEF4FF",
            borderRadius: 8,
          }}
        >
          <Ionicons name="location-outline" size={13} color={COLORS.blue} />
          <Text style={{ fontSize: 12, color: COLORS.blue, fontWeight: "600" }}>
            Konum
          </Text>
        </View>
      ) : null}

      {/* Not (varsa, kısaltılmış) */}
      {truncatedNote ? (
        <Text style={{ fontSize: 13, color: "#667085" }} numberOfLines={2}>
          {truncatedNote}
        </Text>
      ) : null}

      {/* Alt satır: obje sayısı + ok */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 13, color: "#667085" }}>
          {objectCount} nesne
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#667085" />
      </View>
    </TouchableOpacity>
  );
}
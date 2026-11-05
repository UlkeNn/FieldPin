import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/src/lib/theme";
import { Badge } from "@/src/features/workorders/components/Badge";
import { jobTypeLabel } from "@/src/features/workorders/utils/labels";
import type { ServiceRequestListItemDto } from "../api/servicerequests.api";
import {
  formatDateTime,
  requestPriorityColor,
  requestPriorityLabel,
  requestStatusColor,
  requestStatusLabel,
} from "../utils/labels";

type Props = {
  item: ServiceRequestListItemDto;
};

export function ServiceRequestCard({ item }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: "/requests/[id]", params: { id: item.id } })}
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        gap: 8,
      }}
    >
      {/* Üst satır: talep no + tarih */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 15, color: COLORS.blue }}>
          {item.requestNo}
        </Text>
        <Text style={{ fontSize: 13, color: "#667085" }}>{formatDateTime(item.createdAtUtc)}</Text>
      </View>

      {/* Başlık */}
      <Text style={{ fontSize: 15, fontWeight: "700" }} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Durum + öncelik rozetleri */}
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Badge label={requestStatusLabel(item.status)} color={requestStatusColor(item.status)} />
        <Badge
          label={requestPriorityLabel(item.priority)}
          color={requestPriorityColor(item.priority)}
        />
        {item.isOverdue ? <Badge label="SLA Aşıldı" color="#DC2626" /> : null}
      </View>

      {/* Müşteri */}
      <Text style={{ fontSize: 15 }}>
        <Text style={{ fontWeight: "700" }}>Müşteri: </Text>
        {item.customer?.name ?? "—"}
      </Text>

      {/* Alt satır: iş tipi + medya sayısı + ok */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 13, color: "#667085" }}>
          {jobTypeLabel(item.jobType)}
          {item.mediaCount > 0 ? ` · ${item.mediaCount} foto` : ""}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#667085" />
      </View>
    </TouchableOpacity>
  );
}

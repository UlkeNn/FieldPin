//app/requests/[id].tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/lib/theme";
import {
  allowedTargets,
  isTerminal,
  useServiceRequestDetailViewModel,
} from "@/src/features/servicerequests/viewModel/useServiceRequestDetailViewModel";
import {
  formatDateTime,
  requestDeviceTypeLabel,
  requestPriorityColor,
  requestPriorityLabel,
  requestSourceLabel,
  requestStatusColor,
  requestStatusLabel,
} from "@/src/features/servicerequests/utils/labels";
import { ChangeStatusSheet } from "@/src/features/servicerequests/components/ChangeStatusSheet";
import { RequestMediaSection } from "@/src/features/servicerequests/components/RequestMediaSection";
import { useServiceRequestLinkStore } from "@/src/features/servicerequests/store/serviceRequestLink.store";
import { LocationSource } from "@/src/features/workorders/types/workorder.enums";
import {
  jobBadgeColor,
  jobTypeLabel,
  systemTypeLabel,
} from "@/src/features/workorders/utils/labels";

// ─── Talep Detay Ekranı ─────────────────────────────────────────────────────

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vm = useServiceRequestDetailViewModel(id);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

  if (vm.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (vm.isError || !vm.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <BackButton />
        <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 10 }}>Talep Detayı</Text>
        <Text style={{ color: "crimson" }}>
          {(vm.error as Error)?.message || "Veri yüklenemedi."}
        </Text>
      </SafeAreaView>
    );
  }

  const req = vm.data;
  const targets = allowedTargets(req.status);
  const terminal = isTerminal(req.status);

  function handleCreateWorkOrder() {
    useServiceRequestLinkStore.getState().setPending({
      serviceRequestId: req.id,
      requestNo: req.requestNo,
      systemType: req.systemType,
      jobType: req.jobType,
      customer: req.customer ?? null,
    });
    router.push("/(tabs)/create");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BGCOLOR }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <BackButton />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.blue }}>
              {req.requestNo}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "900" }}>{req.title}</Text>
          </View>
        </View>

        {/* ─── Durum + Öncelik + İş Tipi + Sistem ─────────────────────── */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <StatusPill label={requestStatusLabel(req.status)} color={requestStatusColor(req.status)} />
          <StatusPill
            label={requestPriorityLabel(req.priority)}
            color={requestPriorityColor(req.priority)}
          />
          <StatusPill label={jobTypeLabel(req.jobType)} color={jobBadgeColor(req.jobType)} />
          <StatusPill label={systemTypeLabel(req.systemType)} color="#667085" />
          {req.isOverdue ? <StatusPill label="SLA Aşıldı" color="#DC2626" /> : null}
        </View>

        {!terminal && targets.length > 0 && (
          <TouchableOpacity
            onPress={() => setStatusSheetVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: COLORS.blue,
            }}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "800" }}>Durum Değiştir</Text>
          </TouchableOpacity>
        )}

        {/* ─── Bilgi Kartı ────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            gap: 12,
          }}
        >
          {req.description ? (
            <InfoRow icon="document-text-outline" label="Açıklama" value={req.description} />
          ) : null}
          <InfoRow icon="person-outline" label="Müşteri" value={req.customer?.name ?? "—"} />
          {req.customer?.phone ? (
            <InfoRow icon="call-outline" label="Telefon" value={req.customer.phone} />
          ) : null}
          <InfoRow
            icon="hardware-chip-outline"
            label="Cihaz Tipi"
            value={`${requestDeviceTypeLabel(req.deviceType)}${
              req.deviceIdentifier ? ` · ${req.deviceIdentifier}` : ""
            }`}
          />
          <InfoRow icon="radio-outline" label="Kaynak" value={requestSourceLabel(req.source)} />
          {req.requesterName ? (
            <InfoRow icon="person-circle-outline" label="Talep Eden" value={req.requesterName} />
          ) : null}
          {req.requesterPhone ? (
            <InfoRow icon="call-outline" label="Talep Eden Telefon" value={req.requesterPhone} />
          ) : null}
          {req.addressText ? (
            <InfoRow icon="business-outline" label="Adres" value={req.addressText} />
          ) : null}

          {req.latitude != null && req.longitude != null ? (
            <LocationSection
              latitude={req.latitude}
              longitude={req.longitude}
              accuracy={req.locationAccuracy ?? null}
              source={req.locationSource ?? null}
            />
          ) : null}

          {req.slaDueAtUtc ? (
            <InfoRow
              icon="alarm-outline"
              label="SLA Süresi"
              value={formatDateTime(req.slaDueAtUtc)}
            />
          ) : null}
          <InfoRow
            icon="calendar-outline"
            label="Oluşturulma Tarihi"
            value={formatDateTime(req.createdAtUtc)}
          />
          {req.resolutionNote ? (
            <InfoRow icon="checkmark-done-outline" label="Çözüm Notu" value={req.resolutionNote} />
          ) : null}
        </View>

        {/* ─── Medya ──────────────────────────────────────────────────── */}
        <RequestMediaSection
          media={req.media ?? []}
          onAddPress={vm.openAddMediaMenu}
          isUploading={vm.isUploadingMedia}
        />

        {/* ─── Bağlı İş Emirleri ──────────────────────────────────────── */}
        {req.workOrders && req.workOrders.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "800" }}>Bağlı İş Emirleri</Text>
            {req.workOrders.map((wo) => (
              <TouchableOpacity
                key={wo.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/workorders/[id]", params: { id: wo.id } })}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 12,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{formatDateTime(wo.createdAt)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#667085" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* ─── İş Emri Oluştur ────────────────────────────────────────── */}
        {!terminal ? (
          <TouchableOpacity
            onPress={handleCreateWorkOrder}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: COLORS.primary,
            }}
          >
            <Ionicons name="briefcase-outline" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "800" }}>İş Emri Oluştur</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <ChangeStatusSheet
        visible={statusSheetVisible}
        targets={targets}
        submitting={vm.isChangingStatus}
        onCancel={() => setStatusSheetVisible(false)}
        onConfirm={async (target, note) => {
          await vm.changeStatus(target, note);
          setStatusSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Geri Butonu ────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
    >
      <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
      <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 15 }}>Geri</Text>
    </TouchableOpacity>
  );
}

// ─── Durum/Öncelik Rozeti (renkli nokta + metin) ───────────────────────────

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: color + "18",
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{label}</Text>
    </View>
  );
}

// ─── Bilgi Satırı ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Ionicons name={icon as any} size={18} color={COLORS.blue} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#667085", fontWeight: "600" }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Konum Bölümü ───────────────────────────────────────────────────────────
// app/workorders/[id].tsx'teki LocationSection/openInMaps deseninin aynısı —
// o dosyada lokal (export edilmiyor) olduğu için burada aynı desende tekrar yazıldı.

function locationSourceLabel(source: LocationSource | null): string {
  switch (source) {
    case LocationSource.Gps:
      return "GPS";
    case LocationSource.Network:
      return "Ağ";
    case LocationSource.Manual:
      return "Manuel";
    default:
      return "—";
  }
}

async function openInMaps(latitude: number, longitude: number) {
  const label = "Talep Konumu";
  const ll = `${latitude},${longitude}`;
  const nativeUrl = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${ll}`,
    android: `geo:0,0?q=${ll}(${encodeURIComponent(label)})`,
    default: undefined,
  });
  const webUrl = `https://www.google.com/maps?q=${ll}`;

  try {
    if (nativeUrl && (await Linking.canOpenURL(nativeUrl))) {
      await Linking.openURL(nativeUrl);
      return;
    }
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert("Hata", "Harita uygulaması açılamadı.");
  }
}

function LocationSection({
  latitude,
  longitude,
  accuracy,
  source,
}: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: LocationSource | null;
}) {
  const accText = accuracy != null ? `±${Math.round(accuracy)}m` : null;
  const sourceText = locationSourceLabel(source);
  const meta = [accText, sourceText].filter(Boolean).join(" · ");

  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Ionicons name="location-outline" size={18} color={COLORS.blue} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#667085", fontWeight: "600" }}>Konum</Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        {meta ? <Text style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{meta}</Text> : null}

        <TouchableOpacity
          onPress={() => openInMaps(latitude, longitude)}
          activeOpacity={0.7}
          style={{
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: COLORS.blue,
            borderRadius: 8,
          }}
        >
          <Ionicons name="map-outline" size={14} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Haritada Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

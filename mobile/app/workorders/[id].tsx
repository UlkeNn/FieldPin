import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/lib/theme";
import {
  getWorkOrderById,
  type WorkOrderDto,
  type WorkOrderObjectDto,
  type WorkOrderObjectMediaDto,
} from "@/src/features/workorders/api/workorders.api";
import {
  formatDateTime,
  jobTypeLabel,
  systemTypeLabel,
  systemIcon,
  getObjectTypeLabel,
  roleLabel,
} from "@/src/features/workorders/utils/labels";
import { JobType, LocationSource } from "@/src/features/workorders/types/workorder.enums";

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMB_SIZE = (SCREEN_WIDTH - 32 - 14 - 24) / 4; // 4 sütun, kart padding hesabı

// ─── Detay Ekranı ───────────────────────────────────────────────────────────

export default function WorkOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["workorder", id],
    queryFn: () => getWorkOrderById(id!),
    enabled: !!id,
  });

  // Fotoğraf viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<WorkOrderObjectMediaDto[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  function openViewer(media: WorkOrderObjectMediaDto[], startIndex: number) {
    setViewerImages(media);
    setViewerIndex(startIndex);
    setViewerVisible(true);
  }

  // ─── Loading / Error ────────────────────────────────────────────────────

  if (query.isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <BackButton />
        <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 10 }}>
          İş Detayı
        </Text>
        <Text style={{ color: "crimson" }}>
          {(query.error as Error)?.message || "Veri yüklenemedi."}
        </Text>
      </SafeAreaView>
    );
  }

  const wo = query.data;
  const isReplacement = wo.jobType === JobType.Replace;
  const isFault = wo.jobType === JobType.Fault;
  const objects = wo.objects ?? [];

  // Değişim işinde role'e göre grupla
  const oldObjects = objects.filter((o) => o.role === 1);
  const newObjects = objects.filter((o) => o.role === 2);
  const singleObjects = objects.filter((o) => o.role === 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BGCOLOR }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Geri butonu + başlık */}
        <BackButton />
        <Text style={{ fontSize: 26, fontWeight: "900" }}>İş Detayı</Text>

        {/* ─── Özet Bilgiler ──────────────────────────────────────────── */}
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
          <InfoRow
            icon={systemIcon(wo.systemType) as any}
            label="Sistem Tipi"
            value={systemTypeLabel(wo.systemType)}
          />
          <InfoRow
            icon="construct-outline"
            label="İş Tipi"
            value={jobTypeLabel(wo.jobType)}
          />
          <InfoRow
            icon="person-outline"
            label="Müşteri"
            value={wo.customer?.name ?? "—"}
          />
          {wo.customer?.phone ? (
            <InfoRow icon="call-outline" label="Telefon" value={wo.customer.phone} />
          ) : null}
          <InfoRow
            icon="calendar-outline"
            label="Oluşturulma Tarihi"
            value={formatDateTime(wo.createdAt)}
          />
          {wo.notes ? (
            <InfoRow icon="document-text-outline" label="Not" value={wo.notes} />
          ) : null}

          {/* Konum (varsa) — koordinatlar + accuracy + kaynak + "Haritada Aç" */}
          {wo.latitude != null && wo.longitude != null ? (
            <LocationSection
              latitude={wo.latitude}
              longitude={wo.longitude}
              accuracy={wo.locationAccuracy ?? null}
              source={wo.locationSource ?? null}
            />
          ) : null}

          {/* Arıza alanları */}
          {isFault && wo.faultCause ? (
            <InfoRow icon="alert-circle-outline" label="Arıza Sebebi" value={wo.faultCause} />
          ) : null}
          {isFault && wo.faultResolution ? (
            <InfoRow icon="checkmark-done-outline" label="Çözüm" value={wo.faultResolution} />
          ) : null}
        </View>

        {/* ─── Nesneler ───────────────────────────────────────────────── */}
        <Text style={{ fontSize: 20, fontWeight: "800" }}>Eklenen Girdiler</Text>

        {objects.length === 0 && (
          <Text style={{ color: "#667085" }}>Henüz girdi eklenmemiş.</Text>
        )}

        {isReplacement ? (
          <>
            {oldObjects.length > 0 && (
              <ObjectGroup
                title="Eski Nesneler"
                objects={oldObjects}
                systemType={wo.systemType}
                onPhotoPress={openViewer}
              />
            )}
            {newObjects.length > 0 && (
              <ObjectGroup
                title="Yeni Nesneler"
                objects={newObjects}
                systemType={wo.systemType}
                onPhotoPress={openViewer}
              />
            )}
          </>
        ) : (
          singleObjects.length > 0 && (
            <ObjectGroup
              objects={singleObjects}
              systemType={wo.systemType}
              onPhotoPress={openViewer}
            />
          )
        )}
      </ScrollView>

      {/* ─── Fotoğraf Viewer Modalı ─────────────────────────────────── */}
      <PhotoViewerModal
        visible={viewerVisible}
        images={viewerImages}
        selectedIndex={viewerIndex}
        onSelect={setViewerIndex}
        onClose={() => setViewerVisible(false)}
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
      <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 15 }}>
        Geri
      </Text>
    </TouchableOpacity>
  );
}

// ─── Bilgi Satırı ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Ionicons
        name={icon as any}
        size={18}
        color={COLORS.blue}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#667085", fontWeight: "600" }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Nesne Grubu ────────────────────────────────────────────────────────────

function ObjectGroup({
  title,
  objects,
  systemType,
  onPhotoPress,
}: {
  title?: string;
  objects: WorkOrderObjectDto[];
  systemType: number;
  onPhotoPress: (media: WorkOrderObjectMediaDto[], startIndex: number) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {title && (
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#374151" }}>
          {title}
        </Text>
      )}
      {objects.map((obj) => (
        <ObjectCard
          key={obj.id}
          obj={obj}
          systemType={systemType}
          onPhotoPress={onPhotoPress}
        />
      ))}
    </View>
  );
}

// ─── Nesne Kartı ────────────────────────────────────────────────────────────

function ObjectCard({
  obj,
  systemType,
  onPhotoPress,
}: {
  obj: WorkOrderObjectDto;
  systemType: number;
  onPhotoPress: (media: WorkOrderObjectMediaDto[], startIndex: number) => void;
}) {
  const typeLabel = getObjectTypeLabel(obj.objectType, systemType);
  const media = obj.media ?? [];

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        gap: 10,
      }}
    >
      {/* Başlık satırı: tip + identifier */}
      <Text style={{ fontSize: 15, fontWeight: "800" }}>
        {typeLabel.toUpperCase()} · {obj.objectIdentifier ?? "—"}
      </Text>

      {/* Eklenme tarihi */}
      <Text style={{ fontSize: 12, color: "#667085" }}>
        Eklenme: {formatDateTime(obj.createdAt)}
      </Text>

      {/* Not (varsa) */}
      {obj.notes ? (
        <Text style={{ fontSize: 13, color: "#374151" }}>{obj.notes}</Text>
      ) : null}

      {/* Fotoğraf Grid */}
      {media.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {media.map((m, index) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.8}
              onPress={() => onPhotoPress(media, index)}
            >
              <Image
                source={{ uri: m.url }}
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: 10,
                  backgroundColor: "#E5E7EB",
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Fotoğraf Viewer Modal ──────────────────────────────────────────────────

function PhotoViewerModal({
  visible,
  images,
  selectedIndex,
  onSelect,
  onClose,
}: {
  visible: boolean;
  images: WorkOrderObjectMediaDto[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const selected = images[selectedIndex] ?? null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        {/* Ana görüntü */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {selected && (
            <Image
              source={{ uri: selected.url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Alt şerit */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 34,
            backgroundColor: "rgba(0,0,0,0.85)",
            gap: 12,
          }}
        >
          {/* Thumbnail şeridi */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => onSelect(idx)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    overflow: "hidden",
                    borderWidth: idx === selectedIndex ? 2 : 0,
                    borderColor: "white",
                  }}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Sayaç */}
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {selectedIndex + 1} / {images.length}
          </Text>

          {/* Kapat butonu */}
          <TouchableOpacity
            onPress={onClose}
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
  );
}

// ─── Konum Bölümü ───────────────────────────────────────────────────────────

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

/**
 * iOS'ta yerel Apple Maps ("maps:" şeması), Android'de Google Maps niyeti
 * tetiklenir. Her iki platformda da web fallback olarak google.com/maps
 * URL'ine düşer (cihazda harita uygulaması yoksa).
 */
async function openInMaps(latitude: number, longitude: number) {
  const label = "İş Konumu";
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
  const accText =
    accuracy != null ? `±${Math.round(accuracy)}m` : null;
  const sourceText = locationSourceLabel(source);
  const meta = [accText, sourceText].filter(Boolean).join(" · ");

  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Ionicons
        name="location-outline"
        size={18}
        color={COLORS.blue}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#667085", fontWeight: "600" }}>
          Konum
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        {meta ? (
          <Text style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}

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
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            Haritada Aç
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/src/lib/theme";
import type { ServiceRequestMediaDto } from "../api/servicerequests.api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMB_SIZE = (SCREEN_WIDTH - 32 - 14 - 24) / 4; // 4 sütun, kart padding hesabı ([id].tsx ile aynı desen)

type Props = {
  media: ServiceRequestMediaDto[];
  onAddPress: () => void;
  isUploading: boolean;
};

/**
 * Talep medya grid'i + tam ekran viewer.
 *
 * NOT: app/workorders/[id].tsx'teki lokal PhotoViewerModal'dan esinlenir ama onDelete
 * PROP'U YOK — teknisyen controller'ında DELETE /media/{mediaId} endpoint'i yok
 * (yalnızca admin'e açık), dolayısıyla silme affordance'ı hiç gösterilmez.
 */
export function RequestMediaSection({ media, onAddPress, isUploading }: Props) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerVisible(true);
  }

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "800" }}>Fotoğraflar ({media.length})</Text>

        <TouchableOpacity
          onPress={onAddPress}
          disabled={isUploading}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: COLORS.primary,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="camera-outline" size={16} color="white" />
          )}
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            {isUploading ? "Yükleniyor..." : "Fotoğraf Ekle"}
          </Text>
        </TouchableOpacity>
      </View>

      {media.length === 0 ? (
        <Text style={{ color: "#667085" }}>Henüz fotoğraf eklenmemiş.</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {media.map((m, index) => (
            <TouchableOpacity key={m.id} activeOpacity={0.8} onPress={() => openViewer(index)}>
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

      <Modal
        visible={viewerVisible}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {media[viewerIndex] ? (
              <Image
                source={{ uri: media[viewerIndex].url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : null}
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 34,
              backgroundColor: "rgba(0,0,0,0.85)",
              gap: 12,
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {media.map((m, idx) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setViewerIndex(idx)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      overflow: "hidden",
                      borderWidth: idx === viewerIndex ? 2 : 0,
                      borderColor: "white",
                    }}
                  >
                    <Image
                      source={{ uri: m.url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={{ color: "white", textAlign: "center", fontSize: 13, fontWeight: "600" }}>
              {media.length ? `${viewerIndex + 1} / ${media.length}` : ""}
            </Text>

            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
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
    </View>
  );
}

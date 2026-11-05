// src/features/settings/components/ProfileCard.tsx
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/lib/theme";

type Props = {
  username?: string;
  avatarUrl?: string;
  isLoading?: boolean;     // /me query yükleniyor
  isUploading?: boolean;   // avatar yükleme/silme sürüyor
  onPress?: () => void;
};

// "Örnek Kullanıcı" -> "ÖK" gibisinden profilecard gibi alana kullanıcı adının baş harflerini verir.
function initialsOf(username?: string): string {
  if (!username) return "?";
  const cleaned = username.trim();
  if (cleaned.length === 0) return "?";

  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

const AVATAR_SIZE = 56;

export function ProfileCard({
  username,
  avatarUrl,
  isLoading,
  isUploading,
  onPress,
}: Props) {
  const initials = initialsOf(username);

  // Avatar dairesinin içeriği — durumlara göre değişen
  const avatarContent = (
    <View
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          resizeMode="cover"
        />
      ) : isLoading ? (
        <ActivityIndicator color="white" />
      ) : username ? (
        <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={32} color="white" />
      )}

      {/* Yükleme/silme sırasında yarı saydam overlay + spinner */}
      {isUploading && (
        <View
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: "rgba(0,0,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="white" />
        </View>
      )}

      {/* Kamera ikonu (basılabilir olduğunu belli etsin) — sadece onPress varsa */}
      {onPress && !isUploading && (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            borderRadius: 10,
            width: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Ionicons name="camera" size={11} color={COLORS.primary} />
        </View>
      )}
    </View>
  );

  const cardInner = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      {avatarContent}

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
          {username ?? (isLoading ? "Yükleniyor..." : "Kullanıcı")}
        </Text>
        <Text style={{ fontSize: 13, color: "#777", marginTop: 2 }}>
          Teknisyen
        </Text>
      </View>
    </View>
  );

  // onPress verilmemişse statik kart, verildiyse tıklanabilir
  if (!onPress) return cardInner;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isUploading}
    >
      {cardInner}
    </TouchableOpacity>
  );
}

// inline style kullandığımız için StyleSheet.absoluteFill yerine kısa obje
const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// app/(tabs)/settings.tsx
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/src/lib/theme";
import { useSettingsViewModel } from "@/src/features/settings/viewModel/useSettingsViewModel";
import { ProfileCard } from "@/src/features/settings/components/ProfileCard";
import { SettingsSection } from "@/src/features/settings/components/SettingsSection";
import { PermissionRow } from "@/src/features/settings/components/PermissionRow";

export default function SettingsScreen() {
  const vm = useSettingsViewModel();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BGCOLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Başlık */}
        <Text style={{ fontSize: 28, fontWeight: "900", marginBottom: 16 }}>
          Ayarlar
        </Text>

        {/* Profil */}
        <ProfileCard
          username={vm.profile.username}
          avatarUrl={vm.profile.avatarUrl}
          isLoading={vm.profile.isLoading}
          isUploading={vm.profile.isUploading}
          onPress={vm.profile.onPress}
        />

        {/* İzinler */}
        <SettingsSection title="İzinler">
          <PermissionRow
            icon="camera-outline"
            label="Kamera (QR / Fotoğraf)"
            status={vm.permissions.camera.status}
            onPress={vm.permissions.camera.request}
            showDivider
          />
          <PermissionRow
            icon="location-outline"
            label="Konum"
            status={vm.permissions.location.status}
            onPress={vm.permissions.location.request}
          />
        </SettingsSection>

        {/* Çıkış */}
        <TouchableOpacity
          onPress={vm.logout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text
            style={{ color: COLORS.primary, fontWeight: "700", fontSize: 15 }}
          >
            Çıkış Yap
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

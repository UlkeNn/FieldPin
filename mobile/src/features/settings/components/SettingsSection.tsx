// src/features/settings/components/SettingsSection.tsx
import { Text, View } from "react-native";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

/**
 * Settings ekranında "İzinler", "Hesap" gibi bölümler için
 * standart başlık + beyaz kart sarmalayıcı.
 */
export function SettingsSection({ title, children }: Props) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {title}
      </Text>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          overflow: "hidden",
          elevation: 2,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
        }}
      >
        {children}
      </View>
    </View>
  );
}

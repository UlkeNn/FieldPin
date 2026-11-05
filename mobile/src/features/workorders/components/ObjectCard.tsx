import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Props = {
  title: string;
  accentColor: string;
  onAdd?: () => void;
  addLabel?: string;
  addBg?: string;
  children: React.ReactNode;
};

export function ObjectCard({ title, accentColor, onAdd, addLabel, addBg, children }: Props) {
  return (
    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 14, gap: 10, borderLeftWidth: 3, borderLeftColor: accentColor }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "800", fontSize: 15 }}>{title}</Text>
        {onAdd && (
          <TouchableOpacity
            onPress={onAdd}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: addBg }}
          >
            <FontAwesome name="plus" size={12} color={accentColor} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: accentColor }}>{addLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

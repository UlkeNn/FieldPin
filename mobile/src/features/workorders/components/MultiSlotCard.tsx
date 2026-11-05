import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Props = {
  label?: string;
  labelColor: string;
  isSingle: boolean;
  bg: string;
  borderColor: string;
  onRemove?: () => void;
  children: React.ReactNode;
};

export function MultiSlotCard({ label, labelColor, isSingle, bg, borderColor, onRemove, children }: Props) {
  return (
    <View style={{
      backgroundColor: bg,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor,
      gap: 6,
    }}>
      {(label || onRemove) && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {label ? (
            <Text style={{ fontSize: 11, fontWeight: "700", color: labelColor }}>{label}</Text>
          ) : <View />}
          {onRemove && (
            <TouchableOpacity
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#FEE2E2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome name="times" size={11} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

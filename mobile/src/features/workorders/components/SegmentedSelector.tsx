//src/features/workorders/components/SegmentedSelector.tsx
import { TouchableOpacity, Text, View, type ViewStyle } from "react-native";
import { COLORS } from "@/src/lib/theme";

type Option<T> = { label: string; value: T };

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  /** "pill" → her buton ayrı borderRadius (gap ile), "bar" → tek blok, overflow hidden */
  variant?: "bar" | "pill";
};

export function SegmentedSelector<T>({
  options,
  value,
  onChange,
  variant = "bar",
}: Props<T>) {
  const isBar = variant === "bar";

  const containerStyle: ViewStyle = isBar
    ? {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 12,
        overflow: "hidden",
      }
    : { flexDirection: "row", gap: 10 };

  return (
    <View style={containerStyle}>
      {options.map((opt) => {
        const isActive = value === opt.value;

        const itemStyle: ViewStyle = {
          flex: 1,
          padding: isBar ? 12 : 10,
          backgroundColor: isActive ? COLORS.primary : "white",
          ...(isBar ? {} : { borderRadius: 10 }),
        };

        return (
          <TouchableOpacity
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={itemStyle}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "800",
                color: isActive ? "white" : COLORS.blue,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

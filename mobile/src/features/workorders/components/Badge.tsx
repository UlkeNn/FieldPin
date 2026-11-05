import { Text, View } from "react-native";

type Props = {
  label: string;
  color: string;
};

export function Badge({ label, color }: Props) {
  return (
    <View
      style={{
        backgroundColor: color + "18",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{label}</Text>
    </View>
  );
}

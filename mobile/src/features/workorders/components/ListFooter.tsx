import { ActivityIndicator, View } from "react-native";
import { COLORS } from "@/src/lib/theme";

type Props = {
  isLoading: boolean;
};

export function ListFooter({ isLoading }: Props) {
  if (!isLoading) return null;
  return (
    <View style={{ paddingVertical: 20, alignItems: "center" }}>
      <ActivityIndicator size="small" color={COLORS.blue} />
    </View>
  );
}

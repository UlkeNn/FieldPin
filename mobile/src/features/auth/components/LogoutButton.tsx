import { Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useLogoutConfirm } from "../hooks/useLogoutConfirm";

export function LogoutButton() {
  const { confirmLogout } = useLogoutConfirm();

  return (
    <TouchableOpacity
      onPress={confirmLogout}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#FEE2E2",
      }}
    >
      <FontAwesome name="sign-out" size={14} color="#DC2626" />
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#DC2626" }}>Çıkış</Text>
    </TouchableOpacity>
  );
}

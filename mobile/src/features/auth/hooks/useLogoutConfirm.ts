import { Alert } from "react-native";
import { useAuth } from "../AuthProvider";

export function useLogoutConfirm() {
  const { logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Çıkış Yap", style: "destructive", onPress: logout },
      ]
    );
  };

  return { confirmLogout };
}

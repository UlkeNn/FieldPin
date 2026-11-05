import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View, Image, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFInput from "@/src/components/RHFInput";
import { loginApi } from "@/src/features/auth/auth.api"; //api
import { useAuth } from "@/src/features/auth/AuthProvider"; // auth provider
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { COLORS } from "@/src/lib/theme";

const schema = z.object({
  username: z.string().min(1, "Zorunlu"),
  password: z.string().min(1, "Zorunlu"),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [securePassword, setSecurePassword] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" }, // prod-safe
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await loginApi(values);
      await login(res.accessToken);
      // Guard otomatik (tabs) yönlendirir
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Bilinmeyen hata";
      Alert.alert("Giriş başarısız", msg);
    }
  });

  return (

    <ImageBackground
      source={require("../../assets/page-bg.png")}
      style={{ flex: 1, backgroundColor: COLORS.navy }}
      resizeMode="cover"
    >
    <StatusBar style="light" />
    <KeyboardAwareScrollView
    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16, gap: 12 }}
    >

      <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 24 }}>
        {/* Logo beyaz yazılı, bu yüzden koyu arka plan üzerinde duruyor */}
        <Image
          source={require("../../assets/login-logo.png")}
          style={{ width: 260, height: 90, alignSelf: "center" }}
          resizeMode="contain"
        />

        {/* Form beyaz kart içinde: input'lar koyu zeminde okunaklı kalsın */}
        <View style={{ backgroundColor: "white", borderRadius: 20, padding: 20, gap: 12 }}>

        <Text style={{ fontSize: 28, fontWeight: "900" }}>Giriş</Text>

        <RHFInput
          control={control}
          name="username"
          label="Kullanıcı"
          placeholder="Kullanıcı adınızı giriniz:"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
        />

        <View>
          <RHFInput
            control={control}
            name="password"
            label="Şifre"
            placeholder="Şifrenizi giriniz:"
            secureTextEntry={securePassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
          />
          <TouchableOpacity
            onPress={() => setSecurePassword((prev) => !prev)}
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
            }}
            hitSlop={8}
          >
            <Ionicons
              name={securePassword ? "eye-off" : "eye"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>



        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSubmitting}
          style={{
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.primary,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
    </ImageBackground>
  );
}
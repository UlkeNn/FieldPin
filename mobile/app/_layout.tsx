import React, { useState } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/src/features/auth/AuthProvider";
import { KeyboardProvider } from "react-native-keyboard-controller";



function GuardedStack() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) return null;

  const inAuth = segments[0] === "(auth)";

  if (!token && !inAuth) return <Redirect href="/(auth)/login" />;
  if (token && inAuth) return <Redirect href="/(tabs)/create" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GuardedStack />
        </AuthProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}
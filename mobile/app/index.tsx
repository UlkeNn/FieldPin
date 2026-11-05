import React from "react";
import { View, Text, Pressable } from "react-native";
import { router, Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/create" />;
}
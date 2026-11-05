//app/(tabs)/jobs.tsx
import React from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/lib/theme";
import { SegmentedPager } from "@/src/components/SegmentedPager";
import { ServiceRequestList } from "@/src/features/servicerequests/components/ServiceRequestList";
import { WorkOrderHistoryList } from "@/src/features/workorders/components/WorkOrderHistoryList";

export default function JobsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BGCOLOR }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "900" }}>İşler</Text>
        <Image
          source={require("../../assets/topLogo.png")}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
      </View>

      <SegmentedPager
        labels={["Talepler", "Geçmiş"]}
        pages={[<ServiceRequestList key="requests" />, <WorkOrderHistoryList key="history" />]}
      />
    </SafeAreaView>
  );
}

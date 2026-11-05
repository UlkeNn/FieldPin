import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { useServiceRequestListViewModel } from "../viewModel/useServiceRequestListViewModel";
import { ServiceRequestCard } from "./ServiceRequestCard";
import { ListFooter } from "@/src/features/workorders/components/ListFooter";

/**
 * Talepler sayfasının gövdesi (pager içindeki bir sayfa). app/(tabs)/jobs.tsx'in
 * SegmentedPager'ı içinde render edilir. Loading/error kendi içinde gösterilir —
 * sayfa dışındaki başlık ve segmented control her zaman görünür kalsın diye
 * (history.tsx'teki eski "tüm ekranı kaplayan erken return" davranışından bilinçli sapma).
 */
export function ServiceRequestList() {
  const vm = useServiceRequestListViewModel();

  if (vm.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Yükleniyor...</Text>
      </View>
    );
  }

  if (vm.isError) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "crimson", marginBottom: 10 }}>
          {(vm.error as Error)?.message || "Hata oluştu"}
        </Text>
        <Text style={{ color: "#667085" }}>Backend çalışıyor mu? BaseURL doğru mu?</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={vm.data}
      keyExtractor={(x) => x.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshing={vm.isRefetching}
      onRefresh={() => vm.refetch()}
      onEndReached={vm.handleEndReached}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <ServiceRequestCard item={item} />}
      ListFooterComponent={<ListFooter isLoading={vm.isFetchingNextPage} />}
      ListEmptyComponent={
        <Text style={{ color: "#667085", textAlign: "center", marginTop: 40 }}>
          Size atanmış talep yok.
        </Text>
      }
    />
  );
}

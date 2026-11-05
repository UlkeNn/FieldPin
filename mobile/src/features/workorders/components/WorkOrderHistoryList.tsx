import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { useWorkOrderHistoryViewModel } from "../viewModel/useWorkOrderHistoryViewModel";
import { WorkOrderCard } from "./WorkOrderCard";
import { ListFooter } from "./ListFooter";

/**
 * Geçmiş sayfasının gövdesi (pager içindeki bir sayfa). Eski app/(tabs)/history.tsx'in
 * FlatList'i + loading/error/empty durumları buraya taşındı, aynı görsel dille.
 * Şimdi app/(tabs)/jobs.tsx'in SegmentedPager'ı içinde render ediliyor.
 * Loading/error kendi içinde gösterilir (bkz. ServiceRequestList — aynı gerekçe).
 */
export function WorkOrderHistoryList() {
  const vm = useWorkOrderHistoryViewModel();

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
      renderItem={({ item }) => <WorkOrderCard item={item} />}
      ListFooterComponent={<ListFooter isLoading={vm.isFetchingNextPage} />}
      ListEmptyComponent={
        <Text style={{ color: "#667085", textAlign: "center", marginTop: 40 }}>
          Henüz hiç iş yok.
        </Text>
      }
    />
  );
}

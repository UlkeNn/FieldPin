// src/features/workorders/viewModel/useWorkOrderHistoryViewModel.ts
import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyWorkOrders } from "../api/workorders.api";

const PAGE_SIZE = 15;

export function useWorkOrderHistoryViewModel() {
  const query = useInfiniteQuery({
    queryKey: ["workorders", "my"],
    queryFn: ({ pageParam }) => getMyWorkOrders(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined;
      return lastPage.page + 1;
    },
  });

  const data = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const handleEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
    handleEndReached,
  };
}

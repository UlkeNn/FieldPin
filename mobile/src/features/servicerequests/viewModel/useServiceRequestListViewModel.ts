// src/features/servicerequests/viewModel/useServiceRequestListViewModel.ts
//
// useWorkOrderHistoryViewModel.ts ile birebir aynı şekil.
import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyServiceRequests } from "../api/servicerequests.api";

const PAGE_SIZE = 15;

export function useServiceRequestListViewModel() {
  const query = useInfiniteQuery({
    queryKey: ["service-requests", "my"],
    queryFn: ({ pageParam }) => getMyServiceRequests(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined;
      return lastPage.page + 1;
    },
  });

  const data = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

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

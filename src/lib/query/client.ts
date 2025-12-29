import { QueryClient, DefaultOptions } from '@tanstack/react-query'

const queryConfig: DefaultOptions = {
  queries: {
    // Cache time: how long unused data stays in cache
    gcTime: 1000 * 60 * 10, // 10 minutes
    // Stale time: how long data is considered fresh
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Retry configuration
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch configuration
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchOnReconnect: true,
    refetchOnMount: false, // Only refetch if data is stale
  },
  mutations: {
    retry: 0,
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

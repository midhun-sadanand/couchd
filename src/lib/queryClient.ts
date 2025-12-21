import { QueryClient } from "@tanstack/react-query";

// Enterprise-grade React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache Configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache retention (formerly cacheTime)
      
      // Refetch Strategy
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: false, // Don't refetch if data is fresh
      
      // Retry Logic
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Performance
      networkMode: 'online', // Only fetch when online
      
      // Error Handling
      throwOnError: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'online',
    },
  },
});

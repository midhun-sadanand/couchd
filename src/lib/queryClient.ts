import { QueryClient } from "@tanstack/react-query";

// Enterprise-grade React Query configuration with ultra-aggressive caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache Configuration - Ultra-aggressive caching for maximum performance
      staleTime: 60 * 60 * 1000, // 60 minutes (1 hour) - data considered fresh
      gcTime: 4 * 60 * 60 * 1000, // 4 hours - cache retention in memory
      
      // Refetch Strategy - Less aggressive to reduce DB calls
      refetchOnWindowFocus: false, // Don't refetch on window focus (was true)
      refetchOnReconnect: false, // Don't refetch on network reconnect (was true)
      refetchOnMount: false, // Don't refetch if data is fresh
      
      // Retry Logic
      retry: 2, // Reduced from 3 to minimize failed request overhead
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

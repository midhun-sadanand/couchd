"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { SupabaseProvider } from '@/utils/auth';
import { queryClient } from '@/lib/queryClient';

// Create persister for IndexedDB/localStorage fallback
const persister = typeof window !== 'undefined' 
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: 'COUCHD_CACHE',
    })
  : undefined;

export default function Providers({ children }: { children: React.ReactNode }) {
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days - persist cache longer
          buster: 'v3', // Ultra-aggressive caching with 1-hour stale times
        }}
      >
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

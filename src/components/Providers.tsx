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
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: 'v1', // Increment to invalidate all cached data
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

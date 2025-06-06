"use client";

import { SupabaseProvider } from '@/utils/auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}

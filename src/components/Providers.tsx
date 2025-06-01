"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SupabaseProvider } from "@/utils/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

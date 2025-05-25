// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';
import { clerkClient }   from '@clerk/nextjs/server';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export { clerkClient };

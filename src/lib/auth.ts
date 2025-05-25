import { NextRequest, NextResponse } from 'next/server';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export function requireClerk(req: NextRequest, res: NextResponse, next: () => void) {
  return ClerkExpressRequireAuth({
    secretKey: process.env.CLERK_SECRET_KEY!,
    clientSecret: process.env.CLERK_CLIENT_SECRET!,
  })(req as any, res as any, next);
}
    
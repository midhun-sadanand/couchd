import { NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await clerkClient.users.getUser(params.userId);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

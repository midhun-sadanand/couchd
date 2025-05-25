import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();
    const users = await Promise.all(
      userIds.map((id: string) => clerkClient.users.getUser(id))
    );
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

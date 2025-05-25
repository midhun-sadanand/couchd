import { NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET() {
  try {
    const users = await clerkClient.users.getUserList();
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

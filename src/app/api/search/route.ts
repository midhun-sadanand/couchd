import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get('query')?.toLowerCase() || '';

  try {
    const users = await clerkClient.users.getUserList();
    const filtered = users.filter(
      (u: any) => u.username && u.username.toLowerCase().includes(query)
    );
    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

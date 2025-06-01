import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();
    const users = await Promise.all(
      userIds.map((id: string) => clerkClient.users.getUser(id))
    );
    return NextResponse.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

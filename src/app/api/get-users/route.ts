import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();
    // Fetch users by ids from Supabase profiles table
    const { data: users, error } = await supabase.from('profiles').select('id, username, avatar_url, bio').in('id', userIds);
    if (error) throw error;
    return NextResponse.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

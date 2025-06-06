import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get('query')?.toLowerCase() || '';

  try {
    // Search users in Supabase profiles table
    const { data: users, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    const filtered = users.filter(
      (u: any) => (u.username && u.username.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query))
    );
    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

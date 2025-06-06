import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Fetch user by id from Supabase profiles table
    const { data: user, error } = await supabase.from('profiles').select('*').eq('id', params.userId).single();
    if (error) throw error;
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const { data, error } = await supabase
    .from('friends')
    .select('friends')
    .eq('profile_id', params.userId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

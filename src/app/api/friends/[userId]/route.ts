import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: 'supabase' });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
  const { data, error } = await supabase
    .from('friends')
    .select('friends')
    .eq('profile_id', params.userId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

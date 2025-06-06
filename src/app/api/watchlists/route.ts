import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: watchlists, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(watchlists || []));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, isPublic, userId } = body;
  if (!name || !userId) {
    return new Response('Name and userId are required', { status: 400 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: watchlist, error } = await supabase
    .from('watchlists')
    .insert([
      {
        name,
        description,
        is_public: isPublic || false,
        user_id: userId,
      }
    ])
    .select()
    .single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(watchlist));
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query')?.toLowerCase() || '';

    if (!query) {
      return new NextResponse('Query is required', { status: 400 });
    }

    // Search for public watchlists matching the query
    const { data: watchlists, error } = await supabase
      .from('watchlists')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        media_items:media_items (id)
      `)
      .ilike('name', `%${query}%`)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the results
    const formatted = (watchlists || []).map((w: any) => ({
      ...w,
      owner: w.profiles,
      itemCount: w.media_items?.length || 0,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error searching watchlists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the id is a watchlistId or a username
    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('*')
      .eq('id', params.id)
      .single();

    if (watchlistError) {
      // If not a watchlistId, assume it's a username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', params.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return new NextResponse('Not found', { status: 404 });
        }
        throw profileError;
      }

      // Fetch watchlists for the username
      const { data: watchlists, error: watchlistsError } = await supabase
        .from('watchlists')
        .select(`
          *,
          media_items:media_items (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (watchlistsError) throw watchlistsError;

      // Format the results
      const formattedWatchlists = (watchlists || []).map(watchlist => ({
        ...watchlist,
        itemCount: watchlist.media_items?.length || 0,
      }));

      return NextResponse.json(formattedWatchlists);
    }

    // If it's a watchlistId, return the watchlist
    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
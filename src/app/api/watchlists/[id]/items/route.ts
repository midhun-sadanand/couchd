import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: items, error } = await supabase
      .from('media_items')
      .select('*')
      .eq('watchlist_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error fetching watchlist items:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { title, type, tmdb_id, poster_path } = body;

    if (!title || !type || !tmdb_id) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if the user owns the watchlist
    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (watchlistError) {
      if (watchlistError.code === 'PGRST116') {
        return new NextResponse('Watchlist not found', { status: 404 });
      }
      throw watchlistError;
    }

    if (watchlist.user_id !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Add the item to the watchlist
    const { data: item, error: itemError } = await supabase
      .from('media_items')
      .insert([
        {
          title,
          type,
          tmdb_id,
          poster_path,
          watchlist_id: params.id,
        }
      ])
      .select()
      .single();

    if (itemError) throw itemError;

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding item to watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
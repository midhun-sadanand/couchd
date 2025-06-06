import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Add the share
    const { error: shareError } = await supabase
      .from('watchlist_shares')
      .insert([
        {
          watchlist_id: params.id,
          shared_user_id: sharedUserId,
        }
      ]);

    if (shareError) throw shareError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error sharing watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 